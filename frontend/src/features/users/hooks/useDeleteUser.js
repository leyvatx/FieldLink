import { useMutation } from "@tanstack/react-query";
import { deleteUser } from "@api/userService";
import queryClient from "@lib/queryClient";

const useDeleteUser = () => {
  return useMutation({
    mutationFn: async ({ id }) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export default useDeleteUser;