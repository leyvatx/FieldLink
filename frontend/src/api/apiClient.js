import axios from "axios";
import { showGlobalError } from "@lib/globalMessages";
import queryClient from "@lib/queryClient";

const PUBLIC_AUTH_PATHS = new Set(["/login", "/register"]);

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001/api",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (err) => {
    const status = err?.response?.status;
    let message = err?.response?.data?.message;

    if (err?.response?.data instanceof Blob) {
      const text = await err?.response?.data?.text();
      const json = JSON.parse(text);
      message = json.message;
    }

    if (!PUBLIC_AUTH_PATHS.has(window.location.pathname)) {
      if (status === 401) {
        showGlobalError("Sesión expirada. Inicia sesión nuevamente.");
        sessionStorage.setItem("previousUrl", window.location.pathname);
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        queryClient.setQueryData(["auth", "user"], null);
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      } else if (message) {
        showGlobalError(message);
      }
    }

    return Promise.reject(err);
  }
);

export default apiClient;
