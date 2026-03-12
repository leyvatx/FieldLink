import apiClient from "./apiClient";

export const getRolesPermissionsMatrix = async () => {
  const { data } = await apiClient.get("/roles-permissions-matrix");
  return data;
};

export const batchUpdatePermissions = async (payload) => {
  const { data } = await apiClient.post("/roles-permissions/batch", payload);
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
