import { Link } from "react-router-dom";
import useDocumentTitle from "@hooks/useDocumentTitle";
import RegisterForm from "@features/auth/components/RegisterForm";
import AuthShell from "@features/auth/components/AuthShell";

const Register = () => {
  useDocumentTitle("Registro");

  return (
    <AuthShell
      eyebrow="Registro"
      title="Activa tu espacio de trabajo y deja lista tu operación."
      description="Crea la empresa, al usuario principal y la configuración inicial para entrar al panel con una base limpia."
      highlights={[
        "Alta de empresa",
        "Usuario principal",
        "Inicio de sesión automático",
      ]}
      cardTitle="Crear cuenta"
      cardDescription="Registra tu empresa y tu usuario administrador principal."
      footer={
        <>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
};

export default Register;
