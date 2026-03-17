import apiClient from "./apiClient";

export const getSimulationEvents = async () => {
  const { data } = await apiClient.get("/simulations/");
  return data;
};

export const createSimulationEvent = async (payload) => {
  const { data } = await apiClient.post("/simulations/", payload);
  return data;
};

export const processSimulationEvent = async (id) => {
  const { data } = await apiClient.post(`/simulations/${id}/process/`);
  return data;
};
