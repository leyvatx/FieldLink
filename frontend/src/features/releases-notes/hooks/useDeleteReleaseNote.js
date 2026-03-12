import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMessage } from "@context/MessageProvider";
import { deleteReleaseNote } from "@features/releases-notes/services/releaseNoteService";

const useDeleteReleaseNote = () => {
  const queryClient = useQueryClient();
  const { success } = useMessage();

  return useMutation({
    mutationFn: (id) => deleteReleaseNote(id),
    onSuccess: (_, id) => {
      success("Nota eliminada exitosamente");
      queryClient.removeQueries({ queryKey: ["release_notes", id] });
      queryClient.invalidateQueries({ queryKey: ["release_notes"] });
    },
  });
};

export default useDeleteReleaseNote;
