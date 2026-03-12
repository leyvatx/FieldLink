import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authUser } from "@api/authService";

/**
 * Hook para obtener el usuario autenticado.
 */
const useAuthUser = () => {
  const hasToken = !!localStorage.getItem("token");

  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: authUser,
    enabled: hasToken,
  });
};

/**
 * Hook para refrescar el usuario autenticado manualmente.
 */
export const useRefreshAuthUser = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
};

export default useAuthUser;
