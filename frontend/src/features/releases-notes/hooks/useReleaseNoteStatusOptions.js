import { useQuery } from "@tanstack/react-query";
import { getReleaseNoteStatusOptions } from "@features/releases-notes/services/releaseNoteService";
import staticQueryOptions from "@lib/staticQueryOptions";

const useReleaseNoteStatusOptions = () => {
  return useQuery({
    queryFn: getReleaseNoteStatusOptions,
    queryKey: ["release-notes", "status", "options"],
    ...staticQueryOptions,
  });
};

export default useReleaseNoteStatusOptions;
