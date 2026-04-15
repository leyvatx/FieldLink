import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLogo from "@components/AppLogo";
import { getPublicCompanies } from "@api/companyService";

const buildWhatsAppLink = (company) => {
  const rawPhone = (company?.phone || "").toString();
  const digits = rawPhone.replace(/[^0-9]/g, "");
  if (!digits) {
    return null;
  }

  const origin =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "";
  const formUrl = `${origin}/solicitud/${company.slug}`;

  const message =
    `Hola ${company.name}, vi su sitio en FieldLink y me gustaría solicitar un servicio.\n\n` +
    `Puedo llenar su formulario aquí:\n${formUrl}\n\n` +
    `¡Gracias!`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

const VALORES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    titulo: "Confiabilidad",
    descripcion:
      "Sistemas resilientes que garantizan la continuidad de su negocio sin interrupciones.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    titulo: "Innovación",
    descripcion:
      "Evolucionamos constantemente para integrar las últimas tendencias tecnológicas en su flujo.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    titulo: "Excelencia",
    descripcion:
      "Compromiso con la calidad suprema en cada punto de contacto y línea de código.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
    titulo: "Soporte",
    descripcion:
      "Acompañamiento experto para asegurar que su equipo nunca se detenga.",
  },
];


const Landing = () => {
  const sobreRef = useRef(null);
  const valoresRef = useRef(null);
  const [activeSection, setActiveSection] = useState("inicio");

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["public-companies"],
    queryFn: getPublicCompanies,
  });

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight;

      if (scrollY < heroHeight * 0.75) {
        setActiveSection("inicio");
      } else if (valoresRef.current && scrollY < valoresRef.current.offsetTop - 200) {
        setActiveSection("sobre");
      } else {
        setActiveSection("valores");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* ── Header ── */}
      <header className="landing-header">
        <nav className="landing-nav">
          <AppLogo compact showWordmark iconSize={30} />

          <div className="landing-nav-links">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={`landing-nav-link ${activeSection === "inicio" ? "active" : ""}`}>
              Inicio
            </button>
            <button onClick={() => scrollTo(sobreRef)} className={`landing-nav-link ${activeSection === "sobre" ? "active" : ""}`}>
              Sobre Nosotros
            </button>
            <button onClick={() => scrollTo(valoresRef)} className={`landing-nav-link ${activeSection === "valores" ? "active" : ""}`}>
              Valores
            </button>
          </div>

          <Link to="/login" className="landing-cta-sm">
            Iniciar
          </Link>
        </nav>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="landing-hero">
          <div className="landing-hero-bg" aria-hidden="true" />

          <div className="landing-hero-content">
            <span className="landing-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Liderando el Futuro
            </span>

            <h1 className="landing-title">
              FieldLink – <span>Transformando</span> el Servicio de Campo
            </h1>

            <p className="landing-subtitle">
              Liderando la excelencia operativa en gestión de servicios con una
              infraestructura digital diseñada para la escala global.
            </p>

            <div className="landing-hero-actions">
              <Link to="/login" className="landing-cta-primary">
                Iniciar
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <button onClick={() => scrollTo(sobreRef)} className="landing-cta-secondary">
                Saber Más
              </button>
            </div>
          </div>
        </section>

        {/* ── Sobre Nosotros ── */}
        <section ref={sobreRef} className="landing-about">
          <div className="landing-section-inner landing-about-grid">
            <div className="landing-about-text">
              <h2>
                Nuestra Misión:
                <br />
                <span>La Arquitectura de la Confianza</span>
              </h2>

              <p>
                FieldLink nació de la necesidad imperativa de orden en un sector
                tradicionalmente fragmentado. No solo construimos software;
                diseñamos ecosistemas de gestión que funcionan como una
                infraestructura digital robusta, inalterable y precisa.
              </p>
              <p>
                Nuestra visión es redefinir el estándar de la industria mediante
                la integración fluida de datos y operaciones en tiempo real.
                Creemos que la tecnología debe ser invisible pero omnipotente,
                permitiendo que las empresas se enfoquen en lo que realmente
                importa: sus clientes.
              </p>
            </div>

            <div className="landing-about-visual">
              <div className="landing-about-image">
                <div className="landing-about-image-placeholder">
                  <AppLogo showWordmark={false} iconSize={80} />
                </div>
              </div>
              <div className="landing-about-stat">
                <strong>10+</strong>
                <span>Años de Excelencia Operativa</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Valores ── */}
        <section ref={valoresRef} className="landing-values">
          <div className="landing-section-inner">
            <div className="landing-section-header">
              <h2>Nuestros Pilares</h2>
              <div className="landing-section-bar" />
            </div>

            <div className="landing-values-grid">
              {VALORES.map((v) => (
                <div key={v.titulo} className="landing-value-card">
                  <div className="landing-value-icon">{v.icon}</div>
                  <h3>{v.titulo}</h3>
                  <p>{v.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Empresas ── */}
        <section className="landing-companies">
          <div className="landing-section-inner">
            <div className="landing-section-header">
              <h2>Empresas que confían en FieldLink</h2>
              <p className="landing-section-sub">
                Empresas que ya utilizan nuestra plataforma para optimizar su
                operación
              </p>
              <div className="landing-section-bar" />
            </div>

            {loadingCompanies ? (
              <div className="landing-companies-loading">
                <div className="landing-spinner" />
                <p>Cargando empresas...</p>
              </div>
            ) : companies.length === 0 ? (
              <p className="landing-companies-empty">
                Pronto encontrarás aquí a las empresas que confían en nosotros.
              </p>
            ) : (
              <div className="landing-companies-grid">
                {companies.map((company) => {
                  const whatsappLink = buildWhatsAppLink(company);
                  return (
                    <div key={company.slug} className="landing-company-card">
                      <h3>{company.name}</h3>

                      <div className="landing-company-info">
                        {company.email && (
                          <div className="landing-company-row">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="20" height="16" x="2" y="4" rx="2" />
                              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            <span>{company.email}</span>
                          </div>
                        )}
                        {company.phone && (
                          <div className="landing-company-row">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <span>{company.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="landing-company-actions">
                        <Link
                          to={`/solicitud/${company.slug}`}
                          className="landing-company-btn"
                        >
                          Visitar sitio
                        </Link>
                        {whatsappLink && (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="landing-company-btn landing-company-btn--whatsapp"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA Final ── */}
        <section className="landing-final-cta">
          <div className="landing-section-inner">
            <div className="landing-cta-block">
              <div className="landing-cta-orb landing-cta-orb--tl" aria-hidden="true" />
              <div className="landing-cta-orb landing-cta-orb--br" aria-hidden="true" />

              <h2>¿Listo para el cambio?</h2>
              <p>
                Únase a las empresas que ya están liderando la industria con
                FieldLink.
              </p>
              <Link to="/login" className="landing-cta-white">
                Iniciar ahora
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <AppLogo compact showWordmark iconSize={24} />
            <p>© 2026 FieldLink. La Infraestructura Digital de Gestión de Campo.</p>
          </div>
          <div className="landing-footer-links">
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
            <a href="#">Contacto</a>
            <a href="#">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
