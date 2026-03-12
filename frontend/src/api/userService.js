import apiClient from "./apiClient";

const normalizeUserPayload = (payload = {}) => {
  const normalized = {
    name: payload.name?.trim(),
    email: payload.email?.trim(),
    phone: payload.phone?.trim() || "",
    role: payload.role,
    is_active:
      typeof payload.is_active === "boolean" ? payload.is_active : undefined,
    password: payload.password || undefined,
  };

  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined)
  );
};

export const updateSettings = async (settings) => {
  const { data } = await apiClient.patch("/auth/me/", settings);
  return data;
};

export const getUsers = async ({ trashed = false } = {}) => {
  if (trashed) {
    return [];
  }

  const { data } = await apiClient.get("/users/");
  return data;
};

export const createUser = async (payload) => {
  const { data } = await apiClient.post("/users/", normalizeUserPayload(payload));
  return data;
};

export const getUser = async (id) => {
  const { data } = await apiClient.get(`/users/${id}/`);
  return data;
};

export const updateUser = async (id, payload) => {
  const { data } = await apiClient.patch(
    `/users/${id}/`,
    normalizeUserPayload(payload)
  );
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await apiClient.delete(`/users/${id}/`);
  return data;
};

export const getAll = async (params = {}) => {
  const { data } = await apiClient.get("/users/", { params });
  return data;
};

export const restoreUser = async () => {
  return {
    success: false,
    error: "unsupported",
    message: "Restore is not available in the current DRF API.",
  };
};

export const changeUserPassword = async (userId, newPassword) => {
  return await silentRequest(async () => {
    const { data } = await apiClient.patch(`/users/${userId}/`, {
      password: newPassword,
    });
    return { success: true, data };
  });
};

export const validateAdminPassword = async (password) => {
  return await silentRequest(async () => {
    const { data } = await apiClient.post("/auth/validate-password/", {
      password,
    });
    return { success: true, data: { ...data, validated: true } };
  });
};

const silentRequest = async (requestFn) => {
  try {
    return await requestFn();
  } catch (error) {
    const responseData = error.response?.data || {};
    return {
      success: false,
      error: "validation",
      message:
        responseData.detail ||
        responseData.message ||
        "Validation error",
      errors: responseData,
    };
  }
};
