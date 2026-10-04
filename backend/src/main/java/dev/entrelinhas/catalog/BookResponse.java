package dev.entrelinhas.catalog;

import java.time.Instant;

public record BookResponse(Long id, String title, String author, String isbn,
                           int publicationYear, Genre genre, boolean available, Instant createdAt) {
    static BookResponse from(Book book) {
        return new BookResponse(book.getId(), book.getTitle(), book.getAuthor(), book.getIsbn(),
                book.getPublicationYear(), book.getGenre(), book.isAvailable(), book.getCreatedAt());
    }
}
