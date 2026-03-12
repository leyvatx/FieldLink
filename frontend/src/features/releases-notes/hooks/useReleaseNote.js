import { useQuery } from "@tanstack/react-query";
import { getReleaseNote } from "@features/releases-notes/services/releaseNoteService";

const useReleaseNote = (id) => {
  return useQuery({
    queryFn: () => getReleaseNote(id),
    queryKey: ["release-notes", id],
  });
};

export default useReleaseNote;