import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Catalog from "./Catalog.jsx";
import { api } from "./api";

vi.mock("./api", () => ({ api: { list: vi.fn() } }));

const book = {
  id: 1,
  title: "Aurora",
  author: "Clara Vale",
  genre: "FICTION",
  publicationYear: 2024,
  available: true,
};

function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Catalog />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

describe("catalog", () => {
  it("announces loading while awaiting the API", () => {
    api.list.mockImplementation(() => new Promise(() => {}));
    mount();
    expect(screen.getByRole("status")).toHaveTextContent("Carregando livros");
  });

  it("shows an API error and allows retry", async () => {
    api.list
      .mockRejectedValueOnce(new Error("Servidor indisponível"))
      .mockResolvedValue({
        items: [book],
        page: 0,
        totalItems: 1,
        totalPages: 1,
      });
    const user = mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Servidor indisponível",
    );
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByRole("heading", { name: "Aurora" }),
    ).toBeInTheDocument();
  });

  it("shows an empty collection and its creation action", async () => {
    api.list.mockResolvedValue({ items: [], totalItems: 0, totalPages: 0 });
    mount();
    expect(
      await screen.findByText("Sua coleção começa aqui"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Adicionar livro/ }),
    ).toHaveLength(2);
  });

  it("sends title, author, genre, sorting and pagination to the API", async () => {
    api.list.mockResolvedValue({
      items: [book],
      page: 0,
      totalItems: 12,
      totalPages: 2,
    });
    const user = mount();
    await screen.findByRole("heading", { name: "Aurora" });
    await user.type(
      screen.getByRole("textbox", { name: "Buscar por título" }),
      "Aurora",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Buscar por autor" }),
      "Clara",
    );
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filtrar por gênero" }),
      "FICTION",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Ordenar livros" }),
      "author:desc",
    );
    await waitFor(() =>
      expect(api.list.mock.lastCall[0].get("sort")).toBe("author"),
    );
    await screen.findByRole("heading", { name: "Aurora" });
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await waitFor(() => {
      const params = api.list.mock.lastCall[0];
      expect(Object.fromEntries(params)).toEqual({
        page: "1",
        size: "6",
        sort: "author",
        direction: "desc",
        title: "Aurora",
        author: "Clara",
        genre: "FICTION",
      });
    });
  });
});
