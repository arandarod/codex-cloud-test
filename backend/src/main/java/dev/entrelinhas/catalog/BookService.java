package dev.entrelinhas.catalog;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional(readOnly = true)
class BookService {
    private static final Set<String> SORT_FIELDS = Set.of("title", "author", "publicationYear", "createdAt");
    private final BookRepository repository;

    BookService(BookRepository repository) { this.repository = repository; }

    BookPage list(String title, String author, Genre genre, int page, int size, String sort, String direction) {
        if (!SORT_FIELDS.contains(sort) || !(direction.equals("asc") || direction.equals("desc"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ordenação inválida. Use title, author, publicationYear ou createdAt; asc ou desc.");
        }
        Specification<Book> filter = (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (title != null && !title.isBlank()) predicates.add(cb.like(cb.lower(root.get("title")), contains(title), '\\'));
            if (author != null && !author.isBlank()) predicates.add(cb.like(cb.lower(root.get("author")), contains(author), '\\'));
            if (genre != null) predicates.add(cb.equal(root.get("genre"), genre));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        var order = Sort.by(Sort.Direction.fromString(direction), sort).and(Sort.by("id"));
        var result = repository.findAll(filter, PageRequest.of(page, size, order));
        return new BookPage(result.map(BookResponse::from).getContent(), page, size, result.getTotalElements(), result.getTotalPages());
    }

    BookResponse get(Long id) { return BookResponse.from(find(id)); }

    @Transactional
    BookResponse create(BookRequest request) {
        if (repository.existsByIsbn(request.isbn())) throw duplicateIsbn();
        return BookResponse.from(repository.saveAndFlush(new Book(request)));
    }

    @Transactional
    BookResponse update(Long id, BookRequest request) {
        var book = find(id);
        if (repository.existsByIsbnAndIdNot(request.isbn(), id)) throw duplicateIsbn();
        book.update(request);
        return BookResponse.from(repository.saveAndFlush(book));
    }

    @Transactional
    void delete(Long id) { repository.delete(find(id)); }

    private Book find(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livro não encontrado."));
    }

    private ResponseStatusException duplicateIsbn() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um livro com este ISBN.");
    }

    private String contains(String value) {
        return "%" + value.strip().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }
}
