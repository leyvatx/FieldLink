import apiClient from './apiClient';

export const getMovements = async (params) => {
  const response = await apiClient.get(`/admin/log/data?${params}`);
  return response.data;
};
