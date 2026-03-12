import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMessage } from "@context/MessageProvider";
import { createReleaseSection } from "@features/releases-notes/services/releaseSectionService";

const useCreateReleaseSection = () => {
  const queryClient = useQueryClient();
  const { success } = useMessage();

  return useMutation({
    mutationFn: ({ id, formData }) => createReleaseSection(id, formData),
    onSuccess: () => {
      success("Sección creada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["release-notes"] });
    },
  });
};

export default useCreateReleaseSection;
