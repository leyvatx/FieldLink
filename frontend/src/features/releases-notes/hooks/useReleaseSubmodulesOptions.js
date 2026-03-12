import { useQuery } from "@tanstack/react-query";
import { getReleaseSubmodulesOptions } from "@features/releases-notes/services/releaseSubmoduleService";

const useReleaseSubmodulesOptions = (options = {}) => {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryFn: getReleaseSubmodulesOptions,
    queryKey: ["release-submodules", "options"],
    enabled,
  });
};

export default useReleaseSubmodulesOptions;
