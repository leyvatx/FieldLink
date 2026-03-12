import { useQuery } from "@tanstack/react-query";
import { getReleaseChangeTypesOptions } from "@features/releases-notes/services/releaseChangeService";
import staticQueryOptions from "@lib/staticQueryOptions";

const useReleaseChangeTypesOptions = () => {
  return useQuery({
    queryFn: getReleaseChangeTypesOptions,
    queryKey: ["release-changes", "types", "options"],
    ...staticQueryOptions,
  });
};

export default useReleaseChangeTypesOptions;
