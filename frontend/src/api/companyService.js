import apiClient from "./apiClient";

export const getCompanies = async () => {
  const { data } = await apiClient.get("/companies/");
  return data;
};

export const updateCompany = async (slug, payload) => {
  const { data } = await apiClient.patch(`/companies/${slug}/`, payload);
  return data;
};

export const getPublicCompanies = async () => {
  const { data } = await apiClient.get("/public/companies/");
  return data;
};
