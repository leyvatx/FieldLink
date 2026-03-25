import apiClient from "./apiClient";

export const getWorkOrders = async (params = {}) => {
  const { data } = await apiClient.get("/work-orders/", { params });
  return data;
};

export const getWorkOrder = async (id) => {
  const { data } = await apiClient.get(`/work-orders/${id}/`);
  return data;
};

export const createWorkOrder = async (payload) => {
  const { data } = await apiClient.post("/work-orders/", payload);
  return data;
};

export const assignWorkOrder = async (id, technicianId) => {
  const { data } = await apiClient.post(`/work-orders/${id}/assign/`, {
    technician_id: technicianId,
  });
  return data;
};

export const unassignWorkOrder = async (id) => {
  const { data } = await apiClient.post(`/work-orders/${id}/unassign/`);
  return data;
};

export const cancelWorkOrder = async (id) => {
  const { data } = await apiClient.post(`/work-orders/${id}/cancel/`);
  return data;
};

export const startTransitWorkOrder = async (id) => {
  const { data } = await apiClient.post(`/work-orders/${id}/start_transit/`);
  return data;
};

export const arriveWorkOrder = async (id) => {
  const { data } = await apiClient.post(`/work-orders/${id}/arrive/`);
  return data;
};

export const completeWorkOrder = async (id) => {
  const { data } = await apiClient.post(`/work-orders/${id}/complete/`);
  return data;
};
