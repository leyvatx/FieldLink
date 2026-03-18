import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@context/AuthProvider";
import { useDialog } from "@context/DialogProvider";
import PageLoader from "@components/PageLoader";

const PUBLIC_AUTH_PATHS = new Set(["/login", "/register"]);

const AuthGuard = () => {
  const { user, loadingUser } = useAuth();
  const { closeDialogs } = useDialog();
  const location = useLocation();

  if (loadingUser) {
    return <PageLoader />;
  }

  if (user && PUBLIC_AUTH_PATHS.has(location.pathname)) {
    const previousUrl = sessionStorage.getItem("previousUrl");
    sessionStorage.removeItem("previousUrl");

    return (
      <Navigate
        to={previousUrl ?? "/"}
        replace
      />
    );
  }

  if (!user && !PUBLIC_AUTH_PATHS.has(location.pathname)) {
    closeDialogs();

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
};

export default AuthGuard;
