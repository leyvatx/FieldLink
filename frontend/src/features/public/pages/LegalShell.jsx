import { Link } from "react-router-dom";
import AppLogo from "@components/AppLogo";

const LegalShell = ({ kicker, title, updatedAt, children }) => {
  return (
    <div className="landing-page legal-page">
      <header className="landing-header legal-header">
        <nav className="landing-nav">
          <Link to="/" className="legal-brand-link" aria-label="Ir al inicio">
            <AppLogo compact showWordmark iconSize={30} />
          </Link>
          <Link to="/" className="landing-cta-sm">
            Volver al inicio
          </Link>
        </nav>
      </header>

      <main className="legal-main">
        <div className="legal-container">
          <header className="legal-hero">
            {kicker ? <span className="legal-kicker">{kicker}</span> : null}
            <h1 className="legal-title">{title}</h1>
            {updatedAt ? (
              <p className="legal-updated">Última actualización: {updatedAt}</p>
            ) : null}
          </header>

          <article className="legal-content">{children}</article>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <AppLogo compact showWordmark iconSize={24} />
            <p>© 2026 FieldLink. La Infraestructura Digital de Gestión de Campo.</p>
          </div>
          <div className="landing-footer-links">
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/terminos">Términos</Link>
            <Link to="/">Inicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LegalShell;
