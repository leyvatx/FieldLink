import apiClient from "./apiClient";

export const getUsedMaterials = async (params = {}) => {
  const { data } = await apiClient.get("/used-materials/", { params });
  return data;
};

export const getMaterialApprovals = async (params = {}) => {
  const { data } = await apiClient.get("/material-approvals/", { params });
  return data;
};

export const createMaterialApproval = async (payload) => {
  const { data } = await apiClient.post("/material-approvals/", payload);
  return data;
};

export const approveMaterialApproval = async (id) => {
  const { data } = await apiClient.post(`/material-approvals/${id}/approve/`);
  return data;
};

export const rejectMaterialApproval = async (id, reason) => {
  const { data } = await apiClient.post(`/material-approvals/${id}/reject/`, {
    reason,
  });
  return data;
};

export const adjustMaterialApproval = async (id, quantity) => {
  const { data } = await apiClient.post(`/material-approvals/${id}/adjust/`, {
    quantity,
  });
  return data;
};
