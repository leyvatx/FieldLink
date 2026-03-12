import { useQuery } from "@tanstack/react-query";
import { getCurrentReleaseNote } from "@features/releases-notes/services/releaseNoteService";

const useCurrentReleaseNote = () => {
  return useQuery({
    queryFn: getCurrentReleaseNote,
    queryKey: ["release_notes", "current"],
  });
};

export default useCurrentReleaseNote;