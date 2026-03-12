import { Card } from "antd";
import useDocumentTitle from "@hooks/useDocumentTitle";
import LoginForm from "@features/auth/components/LoginForm";
import AppLogo from "@components/AppLogo";

const Login = () => {
  useDocumentTitle("Iniciar sesion");

  return (
    <div className="login-content h-screen grid place-content-center justify-items-center gap-5">
      <AppLogo style={{ width: 200 }} />
      <Card className="w-[330px] !rounded-2xl">
        <h1 className="text-2xl font-bold">Iniciar sesion</h1>
        <p className="text-[#777787] mb-8">
          Ingresa tus credenciales para continuar
        </p>
        <LoginForm />
      </Card>
    </div>
  );
};

export default Login;
