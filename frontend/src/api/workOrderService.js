import apiClient from "./apiClient";

export const getWorkOrders = async (params = {}) => {
  const { data } = await apiClient.get("/work-orders/", { params });
  return data;
};

export const assignWorkOrder = async (id, technicianId) => {
  const { data } = await apiClient.post(`/work-orders/${id}/assign/`, {
    technician_id: technicianId,
  });
  return data;
};
