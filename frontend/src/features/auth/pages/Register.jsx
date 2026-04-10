import { Link } from "react-router-dom";
import useDocumentTitle from "@hooks/useDocumentTitle";
import RegisterForm from "@features/auth/components/RegisterForm";
import AuthShell from "@features/auth/components/AuthShell";

const Register = () => {
  useDocumentTitle("Registro");

  return (
    <AuthShell
      eyebrow="Alta"
      title="Crea la empresa y tu acceso principal."
      description="La cuenta base queda lista para entrar y empezar a configurar sin pasos de sobra."
      highlights={[
        "Empresa",
        "Administrador",
        "Acceso inmediato",
      ]}
      panelTitle="Alta inicial"
      panelItems={[
        {
          label: "Empresa",
          help: "Nombre y slug listos",
          value: "Base",
        },
        {
          label: "Administrador",
          help: "Usuario principal del sistema",
          value: "Principal",
        },
        {
          label: "Arranque",
          help: "Ingreso inmediato al terminar",
          value: "Listo",
        },
      ]}
      cardTitle="Crear cuenta"
      cardDescription="Registra la empresa y el usuario principal."
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
