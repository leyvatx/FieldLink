import { useQuery } from "@tanstack/react-query";
import { getUser } from "@api/userService";
import minutesToMs from "@lib/minutesToMs";

const useUser = (id) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id),
    staleTime: minutesToMs(0),
    cacheTime: minutesToMs(10),
    retry: false,
    refetchOnWindowFocus: false,
  });
};

export default useUser;
