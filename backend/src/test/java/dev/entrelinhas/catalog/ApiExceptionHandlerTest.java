package dev.entrelinhas.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookController.class)
@Import(ApiExceptionHandler.class)
class ApiExceptionHandlerTest {
    @Autowired MockMvc mvc;
    @MockitoBean BookService service;

    @Test
    void unexpectedFailuresReturnProblemDetailsWithoutInternalInformation() throws Exception {
        when(service.get(1L)).thenThrow(new IllegalStateException("private diagnostic information"));
        mvc.perform(get("/api/books/1")).andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.detail").value("Não foi possível concluir a operação. Tente novamente mais tarde."))
                .andExpect(content().string(not(containsString("private diagnostic information"))));
    }
}
