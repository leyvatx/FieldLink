import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@context/AuthProvider";
import PageLoader from "@components/PageLoader";

const RoleGuard = ({ allowedRoles = [] }) => {
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
