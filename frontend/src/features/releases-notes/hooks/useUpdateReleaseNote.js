import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateReleaseNote } from "@features/releases-notes/services/releaseNoteService";
import { useMessage } from "@context/MessageProvider";

const useUpdateReleaseNote = () => {
  const queryClient = useQueryClient();
  const { success } = useMessage();

  return useMutation({
    mutationFn: ({ id, formData }) => updateReleaseNote(id, formData),
    onSuccess: (_, variables) => {
      success("Nota actualizada exitosamente");
      queryClient.invalidateQueries({
        queryKey: ["release-notes"],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: ["release-notes", variables.id],
        exact: true,
      });
    },
  });
};

export default useUpdateReleaseNote;
