import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@api/userService";
import minutesToMs from "@lib/minutesToMs";

const useUsers = ({ trashed = false, role, isActive } = {}) => {
  return useQuery({
    queryKey: ["users", { trashed, role, isActive }],
    queryFn: () => getUsers({ trashed, role, is_active: isActive }),
    staleTime: minutesToMs(0),
    cacheTime: minutesToMs(10),
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export default useUsers;
