import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@context/AuthProvider";
import { useDialog } from "@context/DialogProvider";
import PageLoader from "@components/PageLoader";

const AuthGuard = () => {
  const { user, loadingUser } = useAuth();
  const { closeDialogs } = useDialog();

  if (loadingUser) {
    return <PageLoader />;
  }

  if (!user) {
    closeDialogs();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AuthGuard;
