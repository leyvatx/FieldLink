import { Card } from "@/lib/antd-compat";
import AppLogo from "@components/AppLogo";

const AuthShell = ({
  eyebrow,
  title,
  description,
  highlights = [],
  cardTitle,
  cardDescription,
  footer,
  children,
}) => {
  return (
    <div className="login-content auth-screen">
      <div className="auth-shell">
        <section className="auth-brand">
          <div className="auth-brand-logo">
            <AppLogo />
          </div>

          <div className="auth-brand-copy">
            <span className="auth-eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          {!!highlights.length && (
            <div className="auth-highlights">
              {highlights.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          )}
        </section>

        <Card className="auth-card">
          <h2 className="auth-card-title">{cardTitle}</h2>
          <p className="auth-card-description">{cardDescription}</p>
          {children}
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </Card>
      </div>
    </div>
  );
};

export default AuthShell;
