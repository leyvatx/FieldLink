import apiClient from "./apiClient";

export const getMyCompanyConfig = async () => {
  const { data } = await apiClient.get("/company-config/my_config/");
  return data;
};

export const updateMyCompanyConfig = async (payload) => {
  const { data } = await apiClient.patch("/company-config/my_config/", payload);
  return data;
};
