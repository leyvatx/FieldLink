import apiClient from "@api/apiClient";

export const getReleaseChangeTypesOptions = async () => {
  const { data } = await apiClient.get("/release-changes/types/options");
  return data;
};
