import { Link } from "react-router-dom";
import useDocumentTitle from "@hooks/useDocumentTitle";
import LoginForm from "@features/auth/components/LoginForm";
import AuthShell from "@features/auth/components/AuthShell";

const Login = () => {
  useDocumentTitle("Iniciar sesión");

  return (
    <AuthShell
      eyebrow="Operación en campo"
      title="Coordina solicitudes, inventario y cuadrillas desde un solo lugar."
      description="Entra al centro de mando para asignar trabajo, seguir técnicos y mantener la operación bajo control."
      highlights={[
        "Despacho centralizado",
        "Rastreo en tiempo real",
        "Control de inventario",
      ]}
      cardTitle="Iniciar sesión"
      cardDescription="Ingresa tus credenciales para continuar."
      footer={
        <>
          ¿Aún no tienes cuenta? <Link to="/register">Crea tu registro</Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
};

export default Login;
