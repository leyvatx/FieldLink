import apiClient from "./apiClient";

export const getCustomers = async (params = {}) => {
  const { data } = await apiClient.get("/customers/", { params });
  return data;
};

const normalizeCustomerPayload = (payload = {}) => {
  const normalized = {
    name: payload.name?.trim(),
    phone: payload.phone?.trim(),
    email: payload.email?.trim() || "",
    address: payload.address?.trim(),
  };

  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined)
  );
};

export const createCustomer = async (payload) => {
  const { data } = await apiClient.post(
    "/customers/",
    normalizeCustomerPayload(payload)
  );
  return data;
};
