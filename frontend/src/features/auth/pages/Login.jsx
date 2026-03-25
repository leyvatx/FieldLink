import { Link } from "react-router-dom";
import useDocumentTitle from "@hooks/useDocumentTitle";
import LoginForm from "@features/auth/components/LoginForm";
import AuthShell from "@features/auth/components/AuthShell";

const Login = () => {
  useDocumentTitle("Iniciar sesión");

  return (
    <AuthShell
      eyebrow="Acceso"
      title="Inicia sesión en tu espacio de trabajo."
      description="Ordenes, agenda e inventario quedan en una sola entrada sin pantallas sobrando."
      highlights={[
        "Ordenes",
        "Agenda",
        "Inventario",
      ]}
      panelTitle="Listo para entrar"
      panelItems={[
        {
          label: "Despacho",
          help: "Ordenes y seguimiento",
          value: "Activo",
        },
        {
          label: "Campo",
          help: "Ruta, evidencias y cierres",
          value: "Visible",
        },
        {
          label: "Inventario",
          help: "Stock por almacén y técnico",
          value: "Listo",
        },
      ]}
      cardTitle="Iniciar sesión"
      cardDescription="Usa tu cuenta para entrar al panel."
      footer={
        <>
          Aún no tienes cuenta? <Link to="/register">Crea tu registro</Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
};

export default Login;
