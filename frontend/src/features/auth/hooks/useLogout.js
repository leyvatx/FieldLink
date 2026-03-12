import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@api/authService";

const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    },
  });
};

export default useLogout;
