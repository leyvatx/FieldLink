import { useMutation } from "@tanstack/react-query";
import { updateProfile } from "@api/profileService";
import queryClient from "@lib/queryClient";

const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (payload) => updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export default useUpdateProfile;
