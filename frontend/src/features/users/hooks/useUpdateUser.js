import { useMutation } from "@tanstack/react-query";
import { updateUser } from "@api/userService";
import queryClient from "@lib/queryClient";

const useUpdateUser = () => {
  return useMutation({
    mutationFn: async ({ id, payload }) => updateUser(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      const currentUser = queryClient.getQueryData(["auth", "user"]);
      if (currentUser && currentUser.id === id) {
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      }
    },
  });
};

export default useUpdateUser;
