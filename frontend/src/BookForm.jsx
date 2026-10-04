import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { bookSchema, genres } from "./book-schema";
import Icon from "./Icon.jsx";

export default function BookForm({ book, onSave, saving, error }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: book || {
      title: "",
      author: "",
      isbn: "",
      publicationYear: "",
      genre: "",
      available: true,
    },
  });

  async function submit(values) {
    try {
      await onSave(values);
    } catch (failure) {
      for (const [field, message] of Object.entries(failure.fields || {}))
        setError(field, { message });
    }
  }

  function field(name, label, options = {}) {
    const id = `book-${name}`;
    return (
      <div className={`form-field ${options.full ? "full-width" : ""}`}>
        <label htmlFor={id}>
          {label} <span>*</span>
        </label>
        <input
          id={id}
          {...register(name)}
          {...options.input}
          aria-invalid={!!errors[name]}
          aria-describedby={
            errors[name]
              ? `${id}-error`
              : options.help
                ? `${id}-help`
                : undefined
          }
        />
        {options.help && <small id={`${id}-help`}>{options.help}</small>}
        {errors[name] && (
          <span className="field-error" id={`${id}-error`}>
            {errors[name].message}
          </span>
        )}
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="book-form">
      <div className="form-intro">
        <span className="eyebrow">INFORMAÇÕES DO LIVRO</span>
        <h2>Os detalhes fazem a história.</h2>
        <p>
          Preencha os campos abaixo. Todos os campos com * são obrigatórios.
        </p>
      </div>
      {error && (
        <div role="alert" className="form-error">
          {error.message}
        </div>
      )}
      <fieldset disabled={saving}>
        <legend className="sr-only">Dados do livro</legend>
        <div className="form-grid">
          {field("title", "Título", {
            full: true,
            input: {
              placeholder: "Como se chama esta história?",
              maxLength: 200,
            },
          })}
          {field("author", "Autor", {
            full: true,
            input: { placeholder: "Nome do autor", maxLength: 120 },
          })}
          {field("isbn", "ISBN-13", {
            input: { placeholder: "9780000000019", inputMode: "numeric" },
            help: "13 dígitos. Espaços e hífens são aceitos.",
          })}
          {field("publicationYear", "Ano de publicação", {
            input: {
              type: "number",
              min: 1,
              max: new Date().getFullYear(),
              placeholder: "2025",
            },
          })}
          <div className="form-field full-width">
            <label htmlFor="book-genre">
              Gênero <span>*</span>
            </label>
            <select
              id="book-genre"
              {...register("genre")}
              aria-invalid={!!errors.genre}
              aria-describedby={errors.genre ? "genre-error" : undefined}
            >
              <option value="">Selecione um gênero</option>
              {Object.entries(genres).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.genre && (
              <span className="field-error" id="genre-error">
                {errors.genre.message}
              </span>
            )}
          </div>
          <label className="checkbox-field full-width">
            <input type="checkbox" {...register("available")} />
            <span>
              <strong>Disponível na coleção</strong>
              <small>Desmarque se este livro estiver indisponível.</small>
            </span>
          </label>
        </div>
      </fieldset>
      <div className="form-actions">
        <Link
          className="button secondary"
          to={book ? `/books/${book.id}` : "/"}
        >
          Cancelar
        </Link>
        <button className="button primary" disabled={saving} type="submit">
          {saving
            ? "Salvando…"
            : book
              ? "Salvar alterações"
              : "Adicionar livro"}{" "}
          <Icon name="arrow-up-right" />
        </button>
      </div>
    </form>
  );
}
