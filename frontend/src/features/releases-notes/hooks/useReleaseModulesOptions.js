import { useQuery } from "@tanstack/react-query";
import { getReleaseModulesOptions } from "@features/releases-notes/services/releaseModuleService";

const useReleaseModulesOptions = () => {
  return useQuery({
    queryFn: getReleaseModulesOptions,
    queryKey: ["release-modules", "options"],
  });
};

export default useReleaseModulesOptions;