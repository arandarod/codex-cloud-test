import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { genres } from "./book-schema";
import BookCover from "./BookCover.jsx";
import Icon from "./Icon.jsx";
import { ErrorState, LoadingState } from "./Feedback.jsx";

function DeleteDialog({ book, onCancel, onDelete, pending, error }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="delete-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
    >
      <div className="dialog-icon">×</div>
      <h2 id="delete-title">Excluir este livro?</h2>
      <p id="delete-description">
        “{book.title}” será removido da coleção. Esta ação não pode ser
        desfeita.
      </p>
      {error && (
        <p role="alert" className="field-error">
          {error.message}
        </p>
      )}
      <div className="dialog-actions">
        <button
          className="button secondary"
          onClick={onCancel}
          disabled={pending}
          autoFocus
        >
          Cancelar
        </button>
        <button className="button danger" onClick={onDelete} disabled={pending}>
          {pending ? "Excluindo…" : "Excluir livro"}
        </button>
      </div>
    </dialog>
  );
}

export default function BookDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const query = useQuery({
    queryKey: ["book", id],
    queryFn: ({ signal }) => api.get(id, signal),
  });
  const deletion = useMutation({
    mutationFn: () => api.delete(id),
    onSuccess: async () => {
      client.removeQueries({ queryKey: ["book", id] });
      await client.invalidateQueries({ queryKey: ["books"] });
      navigate("/", { state: { message: "Livro excluído da coleção." } });
    },
  });
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return (
      <>
        <Link to="/" className="back-link">
          ← Voltar ao catálogo
        </Link>
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </>
    );
  const book = query.data;
  return (
    <section className="inner-page">
      <Link to="/" className="back-link">
        ← Voltar ao catálogo
      </Link>
      {location.state?.message && (
        <div className="success-banner" role="status">
          ✓ {location.state.message}
        </div>
      )}
      <div className="detail-layout">
        <div className="detail-cover">
          <BookCover large book={book} />
          <small>Capa ilustrativa · edição fictícia</small>
        </div>
        <div className="detail-content">
          <span className="eyebrow">{genres[book.genre]}</span>
          <h1>{book.title}</h1>
          <p className="detail-author">por {book.author}</p>
          <span
            className={`availability detail-availability ${book.available ? "" : "unavailable"}`}
          >
            <span className="status-dot" />
            {book.available ? "Disponível na coleção" : "Indisponível"}
          </span>
          <dl>
            <div>
              <dt>ISBN-13</dt>
              <dd>{book.isbn}</dd>
            </div>
            <div>
              <dt>Publicação</dt>
              <dd>{book.publicationYear}</dd>
            </div>
            <div>
              <dt>Gênero</dt>
              <dd>{genres[book.genre]}</dd>
            </div>
            <div>
              <dt>Adicionado em</dt>
              <dd>
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
                  new Date(book.createdAt),
                )}
              </dd>
            </div>
          </dl>
          <div className="detail-actions">
            <Link className="button primary" to={`/books/${id}/edit`}>
              Editar livro <Icon name="arrow-up-right" />
            </Link>
            <button
              className="button delete-button"
              onClick={() => {
                deletion.reset();
                setConfirm(true);
              }}
            >
              Excluir livro
            </button>
          </div>
          <div className="detail-note">
            ✦{" "}
            <span>
              Todo livro guarda um universo.
              <br />
              Este já tem um lugar na sua coleção.
            </span>
          </div>
        </div>
      </div>
      {confirm && (
        <DeleteDialog
          book={book}
          onCancel={() => setConfirm(false)}
          onDelete={() => deletion.mutate()}
          pending={deletion.isPending}
          error={deletion.error}
        />
      )}
    </section>
  );
}
