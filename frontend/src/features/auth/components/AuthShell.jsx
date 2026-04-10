import { Card } from "@/lib/antd-compat";
import AppLogo from "@components/AppLogo";

const AuthShell = ({
  eyebrow,
  title,
  description,
  highlights = [],
  panelTitle,
  panelItems = [],
  cardTitle,
  cardDescription,
  footer,
  children,
}) => {
  return (
    <div className="login-content auth-screen">
      <div className="auth-shell">
        <section className="auth-brand">
          <div className="auth-brand-block">
            <div className="auth-brand-header">
              <div className="auth-brand-logo">
                <AppLogo showWordmark={false} iconSize={88} />
              </div>

              <div className="auth-brand-copy">
                <span className="auth-eyebrow">{eyebrow}</span>
                <h1>{title}</h1>
                <p>{description}</p>
              </div>
            </div>

            {!!highlights.length && (
              <div className="auth-highlights">
                {highlights.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            )}
          </div>

          {!!panelItems.length && (
            <div className="auth-panel">
              <div className="auth-panel-badge">{panelTitle || "Operación"}</div>
              <div className="auth-panel-title">Acceso limpio y listo para cualquier pantalla.</div>
              <div className="auth-panel-list">
                {panelItems.map((item) => (
                  <div key={item.label} className="auth-panel-row">
                    <div className="min-w-0">
                      <div className="auth-panel-label">{item.label}</div>
                      {item.help ? (
                        <div className="auth-panel-help">{item.help}</div>
                      ) : null}
                    </div>
                    <div className="auth-panel-value">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <Card className="auth-card">
          <div className="auth-card-shell">
            <div className="auth-card-brand">
              <div className="auth-card-brand-icon">
                <AppLogo compact showWordmark={false} iconSize={40} />
              </div>
              <div className="auth-card-brand-copy">
                <div className="auth-card-badge">{eyebrow}</div>
                <div className="auth-card-brand-label">FieldLink</div>
              </div>
            </div>
            <h2 className="auth-card-title">{cardTitle}</h2>
            <p className="auth-card-description">{cardDescription}</p>
            {children}
            {footer ? <div className="auth-footer">{footer}</div> : null}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthShell;
