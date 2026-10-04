export function ErrorState({ error, onRetry }) {
  return (
    <div className="state error-state" role="alert">
      <span className="state-symbol">!</span>
      <h2>
        {error.status === 404
          ? "Livro não encontrado"
          : "Algo não saiu como esperado"}
      </h2>
      <p>{error.message}</p>
      {onRetry && (
        <button className="button secondary" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function LoadingState({ cards = false }) {
  return (
    <div role="status" aria-live="polite" className="loading-state">
      <span className="sr-only">Carregando livros…</span>
      {cards ? (
        <div className="book-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      ) : (
        <p className="state">Carregando…</p>
      )}
    </div>
  );
}
