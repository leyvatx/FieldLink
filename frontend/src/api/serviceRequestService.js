import apiClient from "./apiClient";

export const createPublicServiceRequest = async (companySlug, payload) => {
  const { data } = await apiClient.post(
    `/public/companies/${companySlug}/service-requests/`,
    payload
  );
  return data;
};

export const createPublicServiceRequestByLanding = async (
  companySlug,
  landingSlug,
  payload
) => {
  const { data } = await apiClient.post(
    `/public/companies/${companySlug}/landings/${landingSlug}/service-requests/`,
    payload
  );
  return data;
};

export const createPublicServiceRequestByHost = async (payload, companySlug = "") => {
  const requestPayload = {
    ...payload,
    ...(companySlug ? { company_slug: companySlug } : {}),
  };
  const { data } = await apiClient.post("/public/service-requests/", requestPayload);
  return data;
};

export const getPublicLanding = async (companySlug = "", landingSlug = "") => {
  const params = {
    ...(companySlug ? { company_slug: companySlug } : {}),
    ...(landingSlug ? { landing_slug: landingSlug } : {}),
  };
  const { data } = await apiClient.get("/public/landing/", { params });
  return data;
};

export const getPublicLandings = async () => {
  const { data } = await apiClient.get("/public-landings/");
  return data;
};

export const createPublicLanding = async (payload) => {
  const { data } = await apiClient.post("/public-landings/", payload);
  return data;
};

export const updatePublicLanding = async (id, payload) => {
  const { data } = await apiClient.patch(`/public-landings/${id}/`, payload);
  return data;
};

export const deletePublicLanding = async (id) => {
  const { data } = await apiClient.delete(`/public-landings/${id}/`);
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
