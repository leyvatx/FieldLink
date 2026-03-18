import apiClient from "./apiClient";

export const createPublicServiceRequest = async (companySlug, payload) => {
  const { data } = await apiClient.post(
    `/public/companies/${companySlug}/service-requests/`,
    payload
  );
  return data;
};

export const getServiceRequests = async (params = {}) => {
  const { data } = await apiClient.get("/service-requests/", { params });
  return data;
};

export const approveServiceRequest = async (id, payload = {}) => {
  const { data } = await apiClient.post(`/service-requests/${id}/approve/`, payload);
  return data;
};

export const rejectServiceRequest = async (id) => {
  const { data } = await apiClient.post(`/service-requests/${id}/reject/`);
  return data;
};

export const validateServiceRequestOtp = async (id) => {
  const { data } = await apiClient.post(`/service-requests/${id}/validate_otp/`);
  return data;
};
