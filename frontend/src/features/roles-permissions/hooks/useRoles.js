import { useQuery } from "@tanstack/react-query";
import { getRoles } from "@api/roleService";
import minutesToMs from "@lib/minutesToMs";

const useRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
    staleTime: minutesToMs(0),
    cacheTime: minutesToMs(10),
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export default useRoles;
