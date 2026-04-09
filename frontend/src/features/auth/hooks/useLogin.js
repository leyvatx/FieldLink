import { useMutation } from "@tanstack/react-query";
import { login } from "@api/authService";
import { AUTH_USER_QUERY_KEY } from "@lib/queryClient";
import queryClient from "@lib/queryClient";

const useLogin = () => {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      queryClient.setQueryData(AUTH_USER_QUERY_KEY, data.user);
    },
  });
};

export default useLogin;
