import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMessage } from "@context/MessageProvider";
import { createReleaseModule } from "@features/releases-notes/services/releaseModuleService";

const useCreateReleaseModule = () => {
  const queryClient = useQueryClient();
  const { success } = useMessage();

  return useMutation({
    mutationFn: (payload) => createReleaseModule(payload),
    onSuccess: () => {
      success("Módulo creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["release-modules"] });
    },
  });
};

export default useCreateReleaseModule;