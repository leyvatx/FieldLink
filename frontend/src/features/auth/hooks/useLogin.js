import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@api/authService";
import { AUTH_USER_QUERY_KEY, resetAppQueries } from "@lib/queryClient";

const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      localStorage.setItem("token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      await resetAppQueries(data.user);
      queryClient.invalidateQueries({ queryKey: AUTH_USER_QUERY_KEY });
    },
  });
};

export default useLogin;
