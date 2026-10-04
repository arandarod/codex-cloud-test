import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BookForm from "./BookForm.jsx";

function mount(props = {}) {
  const onSave = vi.fn().mockResolvedValue({});
  render(
    <MemoryRouter>
      <BookForm onSave={onSave} saving={false} {...props} />
    </MemoryRouter>,
  );
  return { onSave, user: userEvent.setup() };
}

describe("book form", () => {
  it("shows validation and prevents an invalid submission", async () => {
    const { onSave, user } = mount();
    await user.click(screen.getByRole("button", { name: /Adicionar livro/ }));
    expect(await screen.findByText("Informe o título.")).toBeInTheDocument();
    expect(screen.getByText("Informe o autor.")).toBeInTheDocument();
    expect(screen.getByText(/Informe um ISBN-13 válido/)).toBeInTheDocument();
    expect(screen.getByText("Escolha um gênero.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Título/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("creates a book with normalized values", async () => {
    const { onSave, user } = mount();
    await user.type(screen.getByLabelText(/Título/), " Aurora ");
    await user.type(screen.getByLabelText(/Autor/), "Clara Vale");
    await user.type(screen.getByLabelText(/ISBN-13/), "978-0-000000-01-9");
    await user.type(screen.getByLabelText(/Ano de publicação/), "2024");
    await user.selectOptions(screen.getByLabelText(/Gênero/), "FICTION");
    await user.click(screen.getByRole("button", { name: /Adicionar livro/ }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        title: "Aurora",
        author: "Clara Vale",
        isbn: "9780000000019",
        publicationYear: 2024,
        genre: "FICTION",
        available: true,
      }),
    );
  });

  it("edits an existing book and blocks duplicate submissions while saving", async () => {
    const book = {
      id: 1,
      title: "Aurora",
      author: "Clara Vale",
      isbn: "9780000000019",
      publicationYear: 2024,
      genre: "FICTION",
      available: false,
    };
    mount({ book, saving: true });
    expect(screen.getByLabelText(/Título/)).toHaveValue("Aurora");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: /Salvando/ })).toBeDisabled();
    expect(screen.getByLabelText(/Título/)).toBeDisabled();
  });

  it("shows API field errors after a failed save", async () => {
    const book = {
      id: 1,
      title: "Aurora",
      author: "Clara Vale",
      isbn: "9780000000019",
      publicationYear: 2024,
      genre: "FICTION",
      available: true,
    };
    const failure = Object.assign(new Error("Dados inválidos"), {
      fields: { isbn: "Este ISBN já está em uso." },
    });
    const { user } = mount({
      book,
      onSave: vi.fn().mockRejectedValue(failure),
      error: failure,
    });
    await user.click(screen.getByRole("button", { name: /Salvar alterações/ }));
    expect(
      await screen.findByText("Este ISBN já está em uso."),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Dados inválidos");
  });
});
