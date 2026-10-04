package dev.entrelinhas.catalog;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "books")
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

    protected Book() {}

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

    Long getId() { return id; }
    String getTitle() { return title; }
    String getAuthor() { return author; }
    String getIsbn() { return isbn; }
    int getPublicationYear() { return publicationYear; }
    Genre getGenre() { return genre; }
    boolean isAvailable() { return available; }
    Instant getCreatedAt() { return createdAt; }
}
