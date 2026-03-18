import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "@api/authService";

const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      localStorage.setItem("token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      queryClient.setQueryData(["auth", "user"], data.user);
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    },
  });
};

export default useRegister;
