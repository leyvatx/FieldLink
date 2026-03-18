import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@context/AuthProvider";
import PageLoader from "@components/PageLoader";

const RoleGuard = ({
  allowedRoles = [],
  allowSuperuser = true,
  superuserOnly = false,
}) => {
  const { user, loadingUser } = useAuth();

  if (loadingUser) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (superuserOnly && !user.is_superuser) {
    return (
      <Navigate
        to="/not-authorized"
        replace
      />
    );
  }

  if (!superuserOnly && user.is_superuser && !allowSuperuser) {
    return (
      <Navigate
        to="/not-authorized"
        replace
      />
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/not-authorized"
        replace
      />
    );
  }

  return <Outlet />;
};

export default RoleGuard;
