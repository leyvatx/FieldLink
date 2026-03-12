import apiClient from "./apiClient";

export const getProfile = async () => {
  const { data } = await apiClient.get("/auth/me/");
  return data;
};

export const updateProfile = async (payload) => {
  const safePayload = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone || "",
  };

  const { data } = await apiClient.patch("/auth/me/", safePayload);
  return data;
};

export const validateProfilePassword = async (password) => {
  try {
    const { data } = await apiClient.post("/auth/validate-password/", {
      password,
    });
    return { success: true, data };
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 422) {
      return {
        success: false,
        error: "validation",
        message: error.response?.data?.detail || "Contrasena incorrecta",
        errors: error.response?.data || {},
      };
    }
    throw error;
  }
};

export const getImageUrl = () => null;

export const updateProfilePicture = async () => {
  return { success: false, message: "Profile picture endpoint not available." };
};

export const removeProfilePicture = async () => {
  return { success: false, message: "Profile picture endpoint not available." };
};

export const changePassword = async (
  currentPassword,
  newPassword,
  confirmPassword
) => {
  try {
    const { data } = await apiClient.post("/auth/change-password/", {
      old_password: currentPassword,
      new_password: newPassword,
      new_password_confirm: confirmPassword,
    });
    return { success: true, data };
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 422) {
      return {
        success: false,
        error: "validation",
        errors: error.response.data || {},
        message: error.response.data?.detail,
      };
    }
    return {
      success: false,
      error: "server",
      message: "Error al cambiar la contrasena",
    };
  }
};
