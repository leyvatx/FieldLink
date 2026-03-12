import apiClient from "./apiClient";

export const getPermissions = async () => {
  const { data } = await apiClient.get("/permissions");
  return data.map((perm) => ({
    ...perm,
    module: perm.module?.name || "",
    submodule: perm.submodule?.name || "",
    module_id: perm.module_id,
    submodule_id: perm.submodule_id,
  }));
};

export const createPermission = async (payload) => {
  const { data } = await apiClient.post("/permissions", {
    ...payload,
    module_id: payload.module_id,
    submodule_id: payload.submodule_id,
  });
  return data;
};

export const getPermission = async (id) => {
  const { data } = await apiClient.get(`/permissions/${id}`);
  return data;
};

export const updatePermission = async (id, payload) => {
  const { data } = await apiClient.put(`/permissions/${id}`, payload);
  return data;
};

export const deletePermission = async (id) => {
  const { data } = await apiClient.delete(`/permissions/${id}`);
  return data;
};

export const permissionsImportText = async () => {
  const { data } = await apiClient.get("/permissions/import-text");
  return data;
};

export const importPermissions = async (payload) => {
  const { data } = await apiClient.post("/permissions/import", payload);
  return data;
};
