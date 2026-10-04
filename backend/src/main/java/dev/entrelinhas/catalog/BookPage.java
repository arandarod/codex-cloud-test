package dev.entrelinhas.catalog;

import java.util.List;

public record BookPage(List<BookResponse> items, int page, int size, long totalItems, int totalPages) {}
