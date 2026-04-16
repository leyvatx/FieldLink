import axios from "axios";
import { showGlobalError } from "@lib/globalMessages";
import { resetAppQueries } from "@lib/queryClient";

const PUBLIC_AUTH_PATHS = new Set(["/login", "/register"]);
const PUBLIC_ROUTE_PREFIXES = ["/rastreo", "/solicitud"];
const PUBLIC_API_URL_FRAGMENTS = [
  "/tracking/public/",
  "/public/companies/",
  "/public/landings/",
];

const isPublicApiUrl = (url = "") =>
  PUBLIC_API_URL_FRAGMENTS.some((fragment) => url.includes(fragment));

const isPublicRoute = () =>
  PUBLIC_AUTH_PATHS.has(window.location.pathname) ||
  PUBLIC_ROUTE_PREFIXES.some((prefix) =>
    window.location.pathname.startsWith(prefix)
  );

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001/api",
});

apiClient.interceptors.request.use((config) => {
  if (isPublicApiUrl(config.url)) {
    if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  }
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

    const requestUrl = err?.config?.url || "";
    const skipGlobalHandling = isPublicApiUrl(requestUrl) || isPublicRoute();

    if (!skipGlobalHandling) {
      if (status === 401) {
        showGlobalError("Sesión expirada. Inicia sesión nuevamente.");
        sessionStorage.setItem("previousUrl", window.location.pathname);
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        await resetAppQueries(null);
      } else if (message) {
        showGlobalError(message);
      }
    }

    return Promise.reject(err);
  }
);

export default apiClient;
