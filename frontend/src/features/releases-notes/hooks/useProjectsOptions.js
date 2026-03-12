import { useQuery } from "@tanstack/react-query";
import { getProjectsOptions } from "@features/releases-notes/services/projectService";

const useProjectsOptions = (options = {}) => {
  const { enabled = true } = options ?? {};

  return useQuery({
    queryFn: getProjectsOptions,
    queryKey: ["projects", "options"],
    enabled,
  });
};

export default useProjectsOptions;
