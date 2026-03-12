import apiClient from "@api/apiClient";

export const createReleaseModule = async (payload) => {
  const { data } = await apiClient.post("/release-modules", payload);
  return data;
};

export const getReleaseModulesOptions = async () => {
  const { data } = await apiClient.get("/release-modules/options");
  return data;
};