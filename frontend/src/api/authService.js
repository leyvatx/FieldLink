import apiClient from "./apiClient";

export const login = async (credentials) => {
  const { data } = await apiClient.post("/auth/login/", credentials);
  return data;
};

export const logout = async () => {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) {
    return { detail: "No refresh token found" };
  }

  const { data } = await apiClient.post("/auth/logout/", { refresh });
  return data;
};

export const authUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  const { data } = await apiClient.get("/auth/me/");
  return data;
};
