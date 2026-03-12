import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMessage } from "@context/MessageProvider";
import { createReleaseSubmodule } from "@features/releases-notes/services/releaseSubmoduleService";

const useCreateReleaseSubmodule = () => {
  const queryClient = useQueryClient();
  const { success } = useMessage();

  return useMutation({
    mutationFn: (payload) => createReleaseSubmodule(payload),
    onSuccess: () => {
      success("Submódulo creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["release-submodules"] });
    },
  });
};

export default useCreateReleaseSubmodule;