import apiClient from "./apiClient";

export const getCentralWarehouse = async () => {
  const { data } = await apiClient.get("/central-warehouse/");
  return data;
};

export const getTechnicianInventory = async (params = {}) => {
  const { data } = await apiClient.get("/technician-inventory/", { params });
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
