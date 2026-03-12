import apiClient from "./apiClient";

export const getRoles = async () => {
  const { data } = await apiClient.get("/roles");
  return data;
};

export const getRole = async (id) => {
  const { data } = await apiClient.get(`/roles/${id}`);
  return data;
};

export const createRole = async (payload) => {
  const { data } = await apiClient.post("/roles", payload);
  return data;
};

export const updateRole = async (id, payload) => {
  const { data } = await apiClient.put(`/roles/${id}`, payload);
  return data;
};

export const deleteRole = async (id) => {
  const { data } = await apiClient.delete(`/roles/${id}`);
  return data;
};

export const attachPermission = async (roleId, permissionId) => {
  const { data } = await apiClient.post(`/roles/${roleId}/permissions/${permissionId}`);
  return data;
};

export const detachPermission = async (roleId, permissionId) => {
  const { data } = await apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`);
  return data;
};

export const batchUpdatePermissions = async (payload) => {
  const { data } = await apiClient.post('/roles-permissions/batch', payload);
  return data;
};