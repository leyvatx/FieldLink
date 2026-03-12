import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@api/userService";
import minutesToMs from "@lib/minutesToMs";

const useUsers = ({ trashed = false } = {}) => {
  return useQuery({
    queryKey: ["users", { trashed }],
    queryFn: () => getUsers({ trashed }),
    staleTime: minutesToMs(0),
    cacheTime: minutesToMs(10),
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export default useUsers;