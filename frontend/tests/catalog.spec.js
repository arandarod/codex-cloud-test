import { test, expect } from "@playwright/test";

test("catalog search, filters, pagination and complete book lifecycle", async ({
  page,
  request,
}) => {
  const title = "A biblioteca dos encontros";
  let createdId;
  try {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "O seu catálogo" }),
    ).toBeVisible();
    await expect(page.locator(".book-card")).toHaveCount(6);
    await page.screenshot({
      path: "test-results/catalog-desktop.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Próxima página" }).click();
    await expect(page).toHaveURL(/page=1/);
    await expect(page.getByText("Mostrando 7–12")).toBeVisible();

    await page.getByRole("textbox", { name: "Buscar por título" }).fill("mapa");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "O mapa dos dias" }),
    ).toBeVisible();
    await expect(page.locator(".book-card")).toHaveCount(1);
    await page.getByRole("button", { name: "Limpar filtros ×" }).click();
    await page.getByRole("textbox", { name: "Buscar por autor" }).fill("Nina");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await expect(page.locator(".book-card")).toHaveCount(2);
    await page.getByRole("button", { name: "Limpar filtros ×" }).click();
    await page
      .getByRole("combobox", { name: "Filtrar por gênero" })
      .selectOption("POETRY");
    await expect(page.locator(".book-card")).toHaveCount(3);
    await page
      .getByRole("combobox", { name: "Ordenar livros" })
      .selectOption("title:desc");
    await expect(page.locator(".book-card h3").first()).toHaveText(
      "Pequenos infinitos",
    );

    await page.getByRole("link", { name: "Adicionar livro" }).first().click();
    await page.getByRole("button", { name: "Adicionar livro" }).click();
    await expect(page.getByText("Informe o título.")).toBeVisible();
    await expect(page.getByText("Escolha um gênero.")).toBeVisible();
    await page.screenshot({
      path: "test-results/form-validation.png",
      fullPage: true,
    });
    await page.getByLabel("Título", { exact: false }).fill(title);
    await page.getByLabel("Autor", { exact: false }).fill("Autor Fictício");
    await page.getByLabel("ISBN-13", { exact: false }).fill("9780000000996");
    await page.getByLabel("Ano de publicação", { exact: false }).fill("2025");
    await page.getByLabel("Gênero", { exact: false }).selectOption("FICTION");
    await page.getByRole("button", { name: "Adicionar livro" }).click();
    await expect(page.getByRole("status")).toHaveText(/Livro adicionado/);
    createdId = page.url().split("/").pop();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await page.getByRole("link", { name: "Editar livro" }).click();
    await page
      .getByLabel("Título", { exact: false })
      .fill(`${title} — revisada`);
    await page.getByRole("checkbox").uncheck();
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByRole("status")).toHaveText(/Livro atualizado/);
    await expect(page.getByText("Indisponível", { exact: true })).toBeVisible();
    await page.screenshot({
      path: "test-results/book-details.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Excluir livro" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.getByRole("button", { name: "Excluir livro" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Excluir livro" })
      .click();
    await expect(page.getByRole("status")).toHaveText(/Livro excluído/);
    await expect(page.locator(".book-card")).toHaveCount(6);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "test-results/catalog-mobile.png",
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  } finally {
    if (createdId) await request.delete(`/api/books/${createdId}`);
  }
});

test("empty search, missing book and unavailable API are explicit", async ({
  page,
}) => {
  await page.goto("/?title=nenhum-livro-com-este-titulo");
  await expect(
    page.getByRole("heading", { name: "Nenhum livro encontrado" }),
  ).toBeVisible();
  await page.goto("/books/99999999");
  await expect(
    page.getByRole("heading", { name: "Livro não encontrado" }),
  ).toBeVisible();
  await page.route("**/api/books?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/problem+json",
      body: JSON.stringify({
        detail: "Catálogo temporariamente indisponível.",
      }),
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toHaveText(
    /Catálogo temporariamente indisponível/,
  );
  await expect(
    page.getByRole("button", { name: "Tentar novamente" }),
  ).toBeVisible();
});
