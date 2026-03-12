import apiClient from "./apiClient";

export const getModules = async () => {
  const { data } = await apiClient.get("/modules");
  return data;
};

export const createModule = async (payload) => {
  const { data } = await apiClient.post("/modules", payload);
  return data;
};

export const getSubmodules = async () => {
  const { data } = await apiClient.get("/submodules");
  return data;
};

export const createSubmodule = async (payload) => {
  const { data } = await apiClient.post("/submodules", payload);
  return data;
};