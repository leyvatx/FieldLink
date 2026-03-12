import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReleaseNote } from "@features/releases-notes/services/releaseNoteService";
import { useMessage } from "@context/MessageProvider";

const useCreateReleaseNote = () => {
  const queryClient = useQueryClient();
  const { success } = useMessage();

  return useMutation({
    mutationFn: (payload) => createReleaseNote(payload),
    onSuccess: () => {
      success("Nota creada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["release_notes"] });
    },
  });
};

export default useCreateReleaseNote;
