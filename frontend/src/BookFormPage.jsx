import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import BookForm from "./BookForm.jsx";
import BookCover from "./BookCover.jsx";
import { ErrorState, LoadingState } from "./Feedback.jsx";

export default function BookFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["book", id],
    queryFn: ({ signal }) => api.get(id, signal),
    enabled: !!id,
  });
  const mutation = useMutation({
    mutationFn: (values) => (id ? api.update(id, values) : api.create(values)),
    onSuccess: async (book) => {
      client.setQueryData(["book", String(book.id)], book);
      await client.invalidateQueries({ queryKey: ["books"] });
      navigate(`/books/${book.id}`, {
        state: {
          message: id
            ? "Livro atualizado com sucesso."
            : "Livro adicionado à coleção.",
        },
      });
    },
  });

  if (id && query.isPending) return <LoadingState />;
  if (id && query.isError)
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return (
    <section className="inner-page">
      <Link to={id ? `/books/${id}` : "/"} className="back-link">
        ← {id ? "Voltar ao livro" : "Voltar ao catálogo"}
      </Link>
      <div className="inner-heading">
        <div className="eyebrow">CUIDE DA SUA COLEÇÃO</div>
        <h1>{id ? "Editar livro" : "Uma nova história."}</h1>
        <p>
          {id
            ? "Atualize as informações deste livro."
            : "Cada livro é uma porta. Adicione a próxima."}
        </p>
      </div>
      <div className="form-layout">
        <BookForm
          key={id || "new"}
          book={query.data}
          onSave={mutation.mutateAsync}
          saving={mutation.isPending}
          error={mutation.error}
        />
        <aside className="form-aside">
          <BookCover large book={query.data || { genre: "FICTION" }} />
          <p>
            Uma coleção feita
            <br />
            <em>uma história por vez.</em>
          </p>
          <small>
            Capas ilustrativas geradas a partir do gênero.
            <br />
            Não representam edições reais.
          </small>
        </aside>
      </div>
    </section>
  );
}
