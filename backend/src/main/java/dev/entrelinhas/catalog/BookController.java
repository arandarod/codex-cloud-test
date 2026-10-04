package dev.entrelinhas.catalog;

import io.swagger.v3.oas.annotations.Operation;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URI;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
class BookController {
    private final BookService service;

    @GetMapping
    @Operation(summary = "Lista livros; buscas parciais sem distinção de maiúsculas combinadas com AND")
    BookPage list(@RequestParam(required = false) @Size(max = 200) String title,
                  @RequestParam(required = false) @Size(max = 120) String author,
                  @RequestParam(required = false) Genre genre,
                  @RequestParam(defaultValue = "0") @Min(0) int page,
                  @RequestParam(defaultValue = "6") @Min(1) @Max(100) int size,
                  @RequestParam(defaultValue = "title") String sort,
                  @RequestParam(defaultValue = "asc") String direction) {
        return service.list(title, author, genre, page, size, sort, direction);
    }

    @GetMapping("/{id}")
    BookResponse get(@PathVariable @Positive Long id) { return service.get(id); }

    @PostMapping
    ResponseEntity<BookResponse> create(@RequestBody @Valid BookRequest request) {
        var book = service.create(request);
        return ResponseEntity.created(URI.create("/api/books/" + book.id())).body(book);
    }

    @PutMapping("/{id}")
    BookResponse update(@PathVariable @Positive Long id, @RequestBody @Valid BookRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
