import apiClient from "@api/apiClient";

export const createReleaseSubmodule = async (payload) => {
  const { data } = await apiClient.post("/release-submodules", payload);
  return data;
};

export const getReleaseSubmodulesOptions = async () => {
  const { data } = await apiClient.get("/release-submodules/options");
  return data;
};
