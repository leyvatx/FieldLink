import apiClient from "./apiClient";

export const getCustomers = async (params = {}) => {
  const { data } = await apiClient.get("/customers/", { params });
  return data;
};
