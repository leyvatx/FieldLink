import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@api/authService";
import { AUTH_USER_QUERY_KEY, resetAppQueries } from "@lib/queryClient";

const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: async () => {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      await resetAppQueries(null);
      queryClient.invalidateQueries({ queryKey: AUTH_USER_QUERY_KEY });
    },
  });
};

export default useLogout;
