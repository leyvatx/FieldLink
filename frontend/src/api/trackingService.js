import apiClient from "./apiClient";

export const getPublicTracking = async (trackingToken) => {
  const { data } = await apiClient.get(`/public/${trackingToken}/`);
  return data;
};

export const getTechnicianLocations = async (params = {}) => {
  const { data } = await apiClient.get("/locations/", { params });
  return data;
};
