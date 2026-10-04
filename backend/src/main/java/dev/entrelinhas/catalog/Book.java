package dev.entrelinhas.catalog;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "books")
@Getter(AccessLevel.PACKAGE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String author;
    private String isbn;
    private int publicationYear;
    @Enumerated(EnumType.STRING)
    private Genre genre;
    private boolean available;
    @Column(updatable = false)
    private Instant createdAt;

    Book(BookRequest request) {
        update(request);
        createdAt = Instant.now();
    }

    void update(BookRequest request) {
        title = request.title();
        author = request.author();
        isbn = request.isbn();
        publicationYear = request.publicationYear();
        genre = request.genre();
        available = request.available();
    }
}
