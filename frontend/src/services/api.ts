import axios from "axios";
import { API_BASE_URL } from "../config/api";

// Instancia de axios configurada
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos de timeout
});

// Interceptor para agregar headers (excepto para FormData)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("admin_token");

    // Si el token existe, adjuntarlo a la cabecera de Authorization
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    // Si no es FormData, agregar Content-Type JSON
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Si el error es 401, podría ser un token expirado.
      // Borramos el token para forzar un nuevo login.
      if (error.response.status === 401) {
        console.warn("Token inválido o expirado. Limpiando token.");
        localStorage.removeItem("admin_token");

        // Redirigir al login si no estamos ya en él
        if (window.location.pathname !== "/admin/login") {
          // Usamos window.location para forzar recarga, limpiando el estado de React.
          window.location.href = "/admin/login";
        }
      }
      // Si es 403 (Prohibido), solo logueamos, no borramos el token
      // porque el usuario está logueado pero no tiene permisos.
      console.error("❌ Error de Permiso (403):", error.response.data);
    } else {
      // Loguear otros errores de API
      console.error("❌ Error en la API:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
    }
    return Promise.reject(error);
  }
);

export default api;
