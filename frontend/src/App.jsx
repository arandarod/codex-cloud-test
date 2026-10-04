import { useEffect, useRef } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";
import Catalog from "./Catalog.jsx";
import BookDetails from "./BookDetails.jsx";
import BookFormPage from "./BookFormPage.jsx";

function Logo() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M4 6h7c3 0 5 2 5 4 0-2 2-4 5-4h7v20h-7c-3 0-5 2-5 2s-2-2-5-2H4V6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M16 10v18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function App() {
  const mainRef = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <Logo />
          <span>
            entrelinhas<small>CATÁLOGO DE LIVROS</small>
          </span>
        </Link>
        <div className="nav-label">SUA BIBLIOTECA</div>
        <nav aria-label="Principal">
          <NavLink to="/" end>
            <span aria-hidden="true">▤</span> Catálogo{" "}
            <Icon name="arrow-up-right" className="nav-arrow" />
          </NavLink>
          <NavLink to="/books/new">
            <Icon name="plus" /> Adicionar livro
          </NavLink>
        </nav>
        <div className="sidebar-note">
          <Icon name="star" className="note-star" />
          <p>
            Há sempre uma
            <br />
            <em>nova história.</em>
          </p>
          <small>
            Um espaço para organizar
            <br />
            suas próximas descobertas.
          </small>
        </div>
        <div className="sidebar-footer">
          <span className="status-dot" /> PROJETO PESSOAL · DEMO
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span>
            Biblioteca <span className="breadcrumb-divider">/</span>{" "}
            <strong>Seu catálogo</strong>
          </span>
          <span className="topbar-badge">
            <span className="status-dot" /> Dados fictícios
          </span>
        </header>
        <main id="main" ref={mainRef} tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Catalog />} />
            <Route path="/books/new" element={<BookFormPage />} />
            <Route path="/books/:id/edit" element={<BookFormPage />} />
            <Route path="/books/:id" element={<BookDetails />} />
            <Route
              path="*"
              element={
                <div className="state">
                  <h1>Página não encontrada</h1>
                  <Link to="/">Voltar ao catálogo</Link>
                </div>
              }
            />
          </Routes>
        </main>
        <footer className="page-footer">
          <span>Entrelinhas — histórias bem organizadas.</span>
          <span>Feito para explorar. ✦</span>
        </footer>
      </div>
    </div>
  );
}
