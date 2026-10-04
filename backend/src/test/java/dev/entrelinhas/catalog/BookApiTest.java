package dev.entrelinhas.catalog;

import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.ObjectMapper;
import java.time.Year;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class BookApiTest {
    @Container
    static final PostgreSQLContainer database = new PostgreSQLContainer("postgres:18.3");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", database::getJdbcUrl);
        registry.add("spring.datasource.username", database::getUsername);
        registry.add("spring.datasource.password", database::getPassword);
    }

    @Autowired MockMvc mvc;
    @Autowired BookRepository repository;
    @Autowired ObjectMapper json;

    @BeforeEach
    void reset() { repository.deleteAll(); }

    @Test
    void createsReadsUpdatesAndDeletesPersistedBook() throws Exception {
        var id = create("  Aurora  ", "  Clara Vale  ", "9780000000019", "FICTION", true);
        mvc.perform(get("/api/books/{id}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Aurora"))
                .andExpect(jsonPath("$.author").value("Clara Vale"))
                .andExpect(jsonPath("$.createdAt").exists());
        mvc.perform(put("/api/books/{id}", id).contentType("application/json")
                .content(body("Outro título", "Outro autor", "9780000000019", "SCIENCE", false)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.available").value(false));
        assertThat(repository.findById(id).orElseThrow().getGenre()).isEqualTo(Genre.SCIENCE);
        mvc.perform(delete("/api/books/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/books/{id}", id)).andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.detail").value("Livro não encontrado."));
    }

    @Test
    void filtersCaseInsensitivelyCombinesFiltersAndEscapesLikeWildcards() throws Exception {
        create("Aurora 100%", "Clara Vale", "9780000000019", "FICTION", true);
        create("Aurora azul", "Clara Vale", "9780000000026", "POETRY", true);
        create("Caminhos", "Lucas Porto", "9780000000033", "FICTION", false);
        mvc.perform(get("/api/books").param("title", "AURORA").param("author", "CLARA").param("genre", "FICTION"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(get("/api/books").param("title", "%")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1)).andExpect(jsonPath("$.items[0].title").value("Aurora 100%"));
        mvc.perform(get("/api/books").param("author", "porto")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(get("/api/books").param("genre", "POETRY")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1));
        mvc.perform(get("/api/books").param("title", "inexistente")).andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty()).andExpect(jsonPath("$.totalPages").value(0));
    }

    @Test
    void paginatesAndSortsWithStableTieBreaker() throws Exception {
        create("Beta", "Bia", "9780000000019", "FICTION", true);
        var second = create("Alfa", "Ana", "9780000000026", "POETRY", true);
        create("Alfa", "Caio", "9780000000033", "FICTION", false);
        mvc.perform(get("/api/books").param("page", "0").param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(3))
                .andExpect(jsonPath("$.totalPages").value(3)).andExpect(jsonPath("$.items[0].id").value(second));
        mvc.perform(get("/api/books").param("page", "1").param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].author").value("Caio"));
        mvc.perform(get("/api/books").param("sort", "author").param("direction", "desc"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].author").value("Caio"));
        mvc.perform(get("/api/books").param("page", "99"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    void rejectsDuplicateIsbnOnCreateAndUpdateAndKeepsExistingData() throws Exception {
        create("Alfa", "Ana", "9780000000019", "FICTION", true);
        var id = create("Beta", "Bia", "9780000000026", "FICTION", true);
        mvc.perform(post("/api/books").contentType("application/json")
                .content(body("Clone", "Ana", "9780000000019", "FICTION", true)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.status").value(409));
        mvc.perform(put("/api/books/{id}", id).contentType("application/json")
                .content(body("Clone", "Ana", "9780000000019", "FICTION", true)))
                .andExpect(status().isConflict());
        assertThat(repository.findById(id).orElseThrow().getTitle()).isEqualTo("Beta");
    }

    @Test
    void validatesFieldsAndReturnsFieldErrors() throws Exception {
        mvc.perform(post("/api/books").contentType("application/json")
                .content("""
                    {"title":" ","author":"","isbn":"9780000000010","publicationYear":0,"genre":null,"available":null}
                    """))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.title").exists())
                .andExpect(jsonPath("$.errors.author").exists()).andExpect(jsonPath("$.errors.isbn").exists())
                .andExpect(jsonPath("$.errors.publicationYear").exists()).andExpect(jsonPath("$.errors.genre").exists())
                .andExpect(jsonPath("$.errors.available").exists());
        assertThat(repository.count()).isZero();
    }

    @Test
    void rejectsFuturePublicationAndAcceptsNormalizedIsbn() throws Exception {
        var future = body("Alfa", "Ana", "9780000000019", "FICTION", true).replace("2024", "" + (Year.now().getValue() + 1));
        mvc.perform(post("/api/books").contentType("application/json").content(future))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.publicationYear").exists());
        create("Alfa", "Ana", "978-0-000000-01-9", "FICTION", true);
        assertThat(repository.findAll().getFirst().getIsbn()).isEqualTo("9780000000019");
    }

    @ParameterizedTest
    @ValueSource(strings = {"page=-1", "size=0", "size=101", "sort=isbn", "direction=random", "genre=UNKNOWN", "page=abc"})
    void rejectsInvalidQuery(String query) throws Exception {
        mvc.perform(get("/api/books?" + query)).andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    @Test
    void rejectsMalformedJsonAndUnknownGenre() throws Exception {
        mvc.perform(post("/api/books").contentType("application/json").content("{"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
        mvc.perform(post("/api/books").contentType("application/json")
                .content(body("Alfa", "Ana", "9780000000019", "UNKNOWN", true)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsFractionalYearInsteadOfSilentlyTruncatingIt() throws Exception {
        mvc.perform(post("/api/books").contentType("application/json")
                .content(body("Alfa", "Ana", "9780000000019", "FICTION", true).replace("2024", "2024.5")))
                .andExpect(status().isBadRequest());
        assertThat(repository.count()).isZero();
    }

    @Test
    void missingUpdateAndDeleteReturnNotFound() throws Exception {
        mvc.perform(put("/api/books/99999").contentType("application/json")
                .content(body("Alfa", "Ana", "9780000000019", "FICTION", true)))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/books/99999")).andExpect(status().isNotFound());
    }

    @Test
    void allowsConfiguredCorsOriginButRejectsOthers() throws Exception {
        mvc.perform(options("/api/books").header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
        mvc.perform(options("/api/books").header("Origin", "https://untrusted.example")
                .header("Access-Control-Request-Method", "POST")).andExpect(status().isForbidden());
    }

    @Test
    void servesGeneratedOpenApi() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/books'].get").exists());
    }

    private long create(String title, String author, String isbn, String genre, boolean available) throws Exception {
        var result = mvc.perform(post("/api/books").contentType("application/json")
                .content(body(title, author, isbn, genre, available)))
                .andExpect(status().isCreated()).andExpect(header().exists("Location")).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private String body(String title, String author, String isbn, String genre, boolean available) {
        return """
            {"title":"%s","author":"%s","isbn":"%s","publicationYear":2024,"genre":"%s","available":%s}
            """.formatted(title, author, isbn, genre, available);
    }
}
