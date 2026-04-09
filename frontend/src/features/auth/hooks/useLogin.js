import { useMutation } from "@tanstack/react-query";
import { login } from "@api/authService";
import { resetAppQueries } from "@lib/queryClient";

// setQueryData in resetAppQueries is sufficient to trigger AuthGuard redirect
const useLogin = () => {
  return useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      localStorage.setItem("token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      await resetAppQueries(data.user);
    },
  });
};

export default useLogin;
