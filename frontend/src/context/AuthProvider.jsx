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

  return <AuthContext.Provider value={{user, loadingUser, login, logout}}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
