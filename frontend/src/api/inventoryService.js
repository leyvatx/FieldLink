import apiClient from "./apiClient";

export const getMaterials = async (params = {}) => {
  const { data } = await apiClient.get("/materials/", { params });
  return data;
};

export const createMaterial = async (payload) => {
  const { data } = await apiClient.post("/materials/", payload);
  return data;
};

export const getCentralWarehouse = async () => {
  const { data } = await apiClient.get("/central-warehouse/");
  return data;
};

export const receiveWarehouseStock = async (payload) => {
  const { data } = await apiClient.post("/central-warehouse/receive_stock/", payload);
  return data;
};

export const getTechnicianInventory = async (params = {}) => {
  const { data } = await apiClient.get("/technician-inventory/", { params });
  return data;
};

export const assignTechnicianInventory = async (payload) => {
  const { data } = await apiClient.post("/technician-inventory/assign_stock/", payload);
  return data;
};

export const restockTechnicianInventory = async (id, payload) => {
  const { data } = await apiClient.post(
    `/technician-inventory/${id}/restock/`,
    payload
  );
  return data;
};

export const getRestockHistory = async (params = {}) => {
  const { data } = await apiClient.get("/restock-history/", { params });
  return data;
};
