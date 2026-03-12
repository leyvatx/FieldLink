import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMessage } from "@context/MessageProvider";
import { updateSettings } from "@api/userService";

const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  const { error } = useMessage();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    },
    onError: () => {
      error("Error al actualizar los ajustes");
    },
  });
};

export default useUpdateSettings;
