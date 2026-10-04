import { describe, expect, it } from "vitest";
import { bookSchema } from "./book-schema";

const valid = {
  title: "Aurora",
  author: "Clara Vale",
  isbn: "9780000000019",
  publicationYear: 2024,
  genre: "FICTION",
  available: true,
};

describe("book validation", () => {
  it("normalizes title, author, ISBN and year", () => {
    expect(
      bookSchema.parse({
        ...valid,
        title: " Aurora ",
        author: " Clara Vale ",
        isbn: "978-0-000000-01-9",
        publicationYear: "2024",
      }),
    ).toEqual(valid);
  });
  it.each([
    { title: " " },
    { author: "" },
    { isbn: "9780000000010" },
    { isbn: "1234567890128" },
    { publicationYear: 0 },
    { publicationYear: 2024.5 },
    { publicationYear: new Date().getFullYear() + 1 },
    { genre: "UNKNOWN" },
    { title: "a".repeat(201) },
    { author: "a".repeat(121) },
  ])("rejects invalid values: %j", (patch) => {
    expect(bookSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});
