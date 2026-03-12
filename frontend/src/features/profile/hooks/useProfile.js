import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@api/profileService";
import minutesToMs from "@lib/minutesToMs";

const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: minutesToMs(5),
    gcTime: minutesToMs(10),
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

export default useProfile;
