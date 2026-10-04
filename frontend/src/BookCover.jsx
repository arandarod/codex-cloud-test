import { genres } from "./book-schema";

export default function BookCover({ book, large = false }) {
  return (
    <div
      className={`book-cover ${book.genre?.toLowerCase() || "fiction"} ${large ? "large" : ""}`}
      aria-hidden="true"
    >
      <div className="cover-spine" />
      <div className="cover-top">
        EDIÇÃO ENTRELINHAS <span>✦</span>
      </div>
      <div className="cover-art">
        <i />
        <i />
        <i />
      </div>
      <div className="cover-title">{book.title || "Sua próxima história"}</div>
      <div className="cover-author">{book.author || "Nome do autor"}</div>
      <div className="cover-bottom">
        {genres[book.genre] || "Catálogo de livros"}{" "}
        <span>{book.publicationYear || "—"}</span>
      </div>
    </div>
  );
}
