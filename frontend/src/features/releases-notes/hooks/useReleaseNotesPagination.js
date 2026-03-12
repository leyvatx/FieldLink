import { useQuery } from "@tanstack/react-query";
import { getReleaseNotesPagination } from "@features/releases-notes/services/releaseNoteService";

const useReleaseNotesPagination = ({ params = {}, enabled = true }) => {
  return useQuery({
    queryFn: () => getReleaseNotesPagination(params),
    queryKey: ["release_notes", "pagination"],
    enabled,
  });
};

export default useReleaseNotesPagination;
