import { useMutation } from "@tanstack/react-query";
import { createUser } from "@api/userService";
import queryClient from "@lib/queryClient";

const useCreateUser = () => {
  return useMutation({
    mutationFn: async ({ payload }) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export default useCreateUser;
