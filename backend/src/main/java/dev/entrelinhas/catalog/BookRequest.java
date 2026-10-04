package dev.entrelinhas.catalog;

import jakarta.validation.constraints.*;

public record BookRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 120) String author,
        @NotBlank @Isbn13 String isbn,
        @NotNull @PublicationYear Integer publicationYear,
        @NotNull Genre genre,
        @NotNull Boolean available) {
    public BookRequest {
        title = title == null ? null : title.strip();
        author = author == null ? null : author.strip();
        isbn = isbn == null ? null : isbn.replaceAll("[\\s-]", "");
    }
}
