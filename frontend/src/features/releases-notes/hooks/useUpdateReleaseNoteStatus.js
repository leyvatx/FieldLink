import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMessage } from "@context/MessageProvider";
import { updateReleaseNoteStatus } from "@features/releases-notes/services/releaseNoteService";

const useUpdateReleaseNoteStatus = () => {
  const queryClient = useQueryClient();
  const { success } = useMessage();

  return useMutation({
    mutationFn: ({ id, status }) => updateReleaseNoteStatus(id, status),
    onSuccess: () => {
      success("Nota actualizada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["release_notes"] });
    },
  });
};

export default useUpdateReleaseNoteStatus;
