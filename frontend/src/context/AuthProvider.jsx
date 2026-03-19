import { createContext, useContext } from "react";
import useLogin from "@features/auth/hooks/useLogin";
import useLogout from "@features/auth/hooks/useLogout";
import useAuthUser from "@features/auth/hooks/useAuthUser";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const login = useLogin();
  const logout = useLogout();
  const { data: user, isPending } = useAuthUser();
  const loadingUser = !!localStorage.getItem("token") && isPending;
  const permissions = user?.permissions || [];
  const hasPermission = (permission) => permissions.includes(permission);

  return (
    <AuthContext.Provider
      value={{ user, loadingUser, login, logout, permissions, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
