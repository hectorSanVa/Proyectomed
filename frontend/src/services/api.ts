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
    // Prioridad: token de admin primero, luego token de usuario regular
    const adminToken = sessionStorage.getItem("admin_token");
    const usuarioToken = sessionStorage.getItem("usuario_token");

    // Si existe token de admin, usarlo (para rutas de admin)
    if (adminToken) {
      config.headers["Authorization"] = `Bearer ${adminToken}`;
    } 
    // Si no hay token de admin pero hay token de usuario, usarlo (para rutas de usuario)
    else if (usuarioToken) {
      config.headers["Authorization"] = `Bearer ${usuarioToken}`;
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
      // Borramos los tokens para forzar un nuevo login.
      if (error.response.status === 401) {
        console.warn("Token inválido o expirado. Limpiando tokens.");
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_user");
        sessionStorage.removeItem("usuario_token");
        sessionStorage.removeItem("usuario_user");

        // Redirigir al login apropiado según la ruta
        const currentPath = window.location.pathname;
        if (currentPath.startsWith("/admin")) {
          if (currentPath !== "/admin/login") {
            window.location.href = "/admin/login";
          }
        } else {
          if (currentPath !== "/login") {
            window.location.href = "/login";
          }
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
