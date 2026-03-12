import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@api/authService";

const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    },
  });
};

export default useLogin;
