import { useQuery } from "@tanstack/react-query";
import { getCurrentVersionNumber } from "@features/releases-notes/services/releaseNoteService";

const useCurrentVersionNumber = () => {
  return useQuery({
    queryFn: getCurrentVersionNumber,
    queryKey: ["release_notes", "current_version_number"],
  });
};

export default useCurrentVersionNumber;
