import { useAuth } from "@context/AuthProvider";
import { Navigate } from "react-router-dom";
import PageLoader from "@components/PageLoader";
import { useMessage } from "@context/MessageProvider";

const PermissionGuard = ({
  permission = null,
  permissions = [],
  all = false,
  children,
}) => {
  const { user, loadingUser } = useAuth();
  const { error } = useMessage();

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

  const userPermissions = user.permissions || [];

  if (permission && userPermissions.includes(permission)) {
    return children;
  }

  if (permissions.length > 0) {
    const can = all
      ? permissions.every((item) => userPermissions.includes(item))
      : permissions.some((item) => userPermissions.includes(item));

    if (can) {
      return children;
    }
  }

  if (permission || permissions.length > 0) {
    error("No tienes permisos para acceder a esta pagina");
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PermissionGuard;
