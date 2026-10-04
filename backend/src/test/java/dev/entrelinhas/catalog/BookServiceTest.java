package dev.entrelinhas.catalog;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {
    @Mock BookRepository repository;
    @InjectMocks BookService service;

    @Test
    void duplicateIsbnDoesNotWrite() {
        var request = new BookRequest("Aurora", "Clara", "9780000000019", 2024, Genre.FICTION, true);
        when(repository.existsByIsbn(request.isbn())).thenReturn(true);
        assertThatThrownBy(() -> service.create(request)).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void missingBookDoesNotDelete() {
        when(repository.findById(42L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.delete(42L)).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
        verify(repository, never()).delete(any(Book.class));
    }
}
