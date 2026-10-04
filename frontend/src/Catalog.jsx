import { useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { genres } from "./book-schema";
import BookCover from "./BookCover.jsx";
import Icon from "./Icon.jsx";
import { ErrorState, LoadingState } from "./Feedback.jsx";

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const parsedPage = Number(params.get("page") || 0);
  const page = Number.isInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0;
  const sort = params.get("sort") || "title";
  const direction = params.get("direction") || "asc";
  const filters = new URLSearchParams({
    page: String(page),
    size: "6",
    sort,
    direction,
  });
  for (const key of ["title", "author", "genre"])
    if (params.get(key)) filters.set(key, params.get(key));
  const query = useQuery({
    queryKey: ["books", filters.toString()],
    queryFn: ({ signal }) => api.list(filters, signal),
  });

  const totalPages = query.data?.totalPages;
  useEffect(() => {
    if (totalPages !== undefined && page > 0 && page >= totalPages) {
      setParams(
        (current) => {
          current.set("page", String(Math.max(0, totalPages - 1)));
          return current;
        },
        { replace: true },
      );
    }
  }, [page, totalPages, setParams]);

  function changeFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  }

  function search(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams(params);
    for (const key of ["title", "author"]) {
      const value = form.get(key).trim();
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    setParams(next);
  }

  const activeFilters = ["title", "author", "genre"].some((key) =>
    params.get(key),
  );

  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">ENTRE PÁGINAS E POSSIBILIDADES</div>
          <h1>
            Boas histórias.
            <br />
            <em>Novas descobertas.</em>
          </h1>
          <p>
            Explore, organize e dê espaço às histórias
            <br className="desktop-break" /> que merecem fazer parte da sua
            coleção.
          </p>
          <Link className="button primary" to="/books/new">
            <Icon name="plus" /> Adicionar livro
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <Icon name="star" className="hero-star" />
          <div className="hero-book book-one">
            <span>
              UM
              <br />
              MUNDO
              <br />
              EM CADA
              <br />
              <em>PÁGINA.</em>
            </span>
            <small>ENTRELINHAS</small>
          </div>
          <div className="hero-book book-two">
            <span>
              o prazer
              <br />
              <em>de descobrir</em>
            </span>
            <i />
          </div>
          <span className="hero-caption">
            A PRÓXIMA HISTÓRIA ESTÁ AQUI <Icon name="arrow-up-right" />
          </span>
        </div>
      </section>
      {location.state?.message && (
        <div role="status" className="success-banner">
          ✓ {location.state.message}
        </div>
      )}
      <section className="catalog-section" aria-labelledby="catalog-heading">
        <div className="section-heading">
          <div>
            <div className="eyebrow">EXPLORE A COLEÇÃO</div>
            <h2 id="catalog-heading">
              O seu catálogo{" "}
              <span className="count-badge">
                {query.data?.totalItems ?? "—"}
              </span>
            </h2>
          </div>
          <span className="section-caption">
            Pequenas estantes, grandes universos.
          </span>
        </div>
        <div className="toolbar">
          <form
            onSubmit={search}
            className="search-form"
            key={`${params.get("title")}:${params.get("author")}`}
            role="search"
          >
            <label className="search-input">
              <span aria-hidden="true">⌕</span>
              <input
                name="title"
                aria-label="Buscar por título"
                placeholder="Buscar por título…"
                defaultValue={params.get("title") || ""}
                maxLength={200}
              />
            </label>
            <label className="search-input author-search">
              <input
                name="author"
                aria-label="Buscar por autor"
                placeholder="Nome do autor…"
                defaultValue={params.get("author") || ""}
                maxLength={120}
              />
            </label>
            <button className="button search-button" type="submit">
              Buscar
            </button>
          </form>
          <label className="filter-label">
            <span className="sr-only">Filtrar por gênero</span>
            <select
              aria-label="Filtrar por gênero"
              value={params.get("genre") || ""}
              onChange={(event) => changeFilter("genre", event.target.value)}
            >
              <option value="">Todos os gêneros</option>
              {Object.entries(genres).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-label">
            <span className="sr-only">Ordenar livros</span>
            <select
              aria-label="Ordenar livros"
              value={`${sort}:${direction}`}
              onChange={(event) => {
                const [field, order] = event.target.value.split(":");
                const next = new URLSearchParams(params);
                next.set("sort", field);
                next.set("direction", order);
                next.delete("page");
                setParams(next);
              }}
            >
              <option value="title:asc">Título: A–Z</option>
              <option value="title:desc">Título: Z–A</option>
              <option value="author:asc">Autor: A–Z</option>
              <option value="author:desc">Autor: Z–A</option>
              <option value="publicationYear:desc">Ano: mais recentes</option>
              <option value="publicationYear:asc">Ano: mais antigos</option>
              <option value="createdAt:desc">Adicionados recentemente</option>
            </select>
          </label>
        </div>
        {activeFilters && (
          <div className="active-filters">
            <span>Filtros aplicados</span>
            <button onClick={() => setParams({})}>Limpar filtros ×</button>
          </div>
        )}
        {query.isPending ? (
          <LoadingState cards />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : query.data.items.length === 0 ? (
          <div className="state">
            <span className="state-symbol">▤</span>
            <h2>
              {activeFilters
                ? "Nenhum livro encontrado"
                : "Sua coleção começa aqui"}
            </h2>
            <p>
              {activeFilters
                ? "Experimente outro título, autor ou gênero."
                : "Adicione o primeiro livro e abra espaço para novas histórias."}
            </p>
            {activeFilters ? (
              <button
                className="button secondary"
                onClick={() => setParams({})}
              >
                Limpar filtros
              </button>
            ) : (
              <Link className="button primary" to="/books/new">
                Adicionar livro
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="book-grid">
              {query.data.items.map((book) => (
                <article className="book-card" key={book.id}>
                  <Link
                    to={`/books/${book.id}`}
                    className="cover-link"
                    aria-label={`Ver detalhes de ${book.title}`}
                  >
                    <BookCover book={book} />
                  </Link>
                  <div className="book-meta">
                    <div className="book-category">
                      <span>{genres[book.genre]}</span>
                      <span
                        className={`availability ${book.available ? "" : "unavailable"}`}
                      >
                        <span className="status-dot" />
                        {book.available ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                    <h3>
                      <Link to={`/books/${book.id}`}>{book.title}</Link>
                    </h3>
                    <p>{book.author}</p>
                    <div className="book-card-bottom">
                      <span>{book.publicationYear}</span>
                      <Link to={`/books/${book.id}`}>
                        Ver livro <Icon name="arrow-up-right" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <nav className="pagination" aria-label="Paginação">
              <span>
                Mostrando {page * 6 + 1}–
                {Math.min((page + 1) * 6, query.data.totalItems)} de{" "}
                {query.data.totalItems} livros
              </span>
              <div>
                <button
                  aria-label="Página anterior"
                  disabled={page === 0}
                  onClick={() =>
                    setParams((current) => {
                      current.set("page", String(page - 1));
                      return current;
                    })
                  }
                >
                  <Icon name="arrow-left" />
                </button>
                <span>
                  Página <strong>{page + 1}</strong> de {query.data.totalPages}
                </span>
                <button
                  aria-label="Próxima página"
                  disabled={page + 1 >= query.data.totalPages}
                  onClick={() =>
                    setParams((current) => {
                      current.set("page", String(page + 1));
                      return current;
                    })
                  }
                >
                  <Icon name="arrow-right" />
                </button>
              </div>
            </nav>
          </>
        )}
      </section>
    </>
  );
}
