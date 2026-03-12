import { useQuery } from "@tanstack/react-query";
import { fetchRolesPermissionsMatrix } from "../services/rolePermissionsActions.js";

export const useRolesPermissionsMatrix = () => {
  return useQuery({
    queryKey: ["roles-permissions-matrix"],
    queryFn: fetchRolesPermissionsMatrix,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
  });
};
