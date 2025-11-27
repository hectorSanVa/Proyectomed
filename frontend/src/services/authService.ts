import api from "./api";
// --- 1. IMPORTAR AxiosError ---
import { AxiosError } from "axios";
import type { User, LoginCredentials, LoginResponse } from "../types";

// Definir claves para sessionStorage (no localStorage - más profesional)
const ADMIN_TOKEN_KEY = "admin_token";
const ADMIN_USER_KEY = "admin_user";

export const authService = {
  /**
   * MODIFICADO: Ahora maneja la respuesta del token JWT
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      // La respuesta del backend ahora es: { success: true, token: "...", user: {...} }
      const response = await api.post<LoginResponse>(
        "/auth/admin/login",
        credentials
      );
      const { data } = response;

      if (data.success && data.token && data.user) {
        // 1. Guardar el TOKEN en sessionStorage (se limpia al cerrar navegador)
        sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        // 2. Guardar el USUARIO en sessionStorage
        sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
      }
      return data;

      // --- 2. MODIFICAR EL CATCH ---
    } catch (error) {
      // Especificamos el tipo de error que esperamos
      const axiosError = error as AxiosError<{ error?: string }>; // Manejar error de login (ej. 401 Credenciales inválidas)
      const errorMsg =
        axiosError.response?.data?.error || "Error en el inicio de sesión";
      return { success: false, error: errorMsg };
    }
    // --- FIN DE LA MODIFICACIÓN ---
  }
  /**
   * MODIFICADO: Limpia el token y el usuario
   */,

  logout: () => {
    sessionStorage.removeItem(ADMIN_USER_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    // Opcional: Redirigir al login para asegurar que todo el estado se limpie
    if (window.location.pathname !== "/admin/login") {
      window.location.href = "/admin/login";
    }
  }
  /**
   * MODIFICADO: Lee el usuario de sessionStorage
   */,

  getCurrentUser: (): User | null => {
    const userStr = sessionStorage.getItem(ADMIN_USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  /**
   * NUEVA FUNCIÓN: Verifica el token contra el backend
   * Esto es llamado por AuthContext.tsx al cargar la app
   */,

  verifySession: async (): Promise<User | null> => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
      // No hay token, no hay sesión
      return null;
    }

    try {
      // Llama a /auth/verify.
      // El interceptor de 'api.ts' añadirá el token a esta llamada.
      const response = await api.get("/auth/verify");

      if (response.data.success && response.data.user) {
        // El token es válido, el backend nos devuelve los datos del usuario
        // (ej. { id: 1, rol: 'admin' })
        // Actualizamos el usuario en sessionStorage con los datos frescos
        sessionStorage.setItem(
          ADMIN_USER_KEY,
          JSON.stringify(response.data.user)
        );
        return response.data.user as User;
      } // El backend dijo éxito pero no mandó usuario (raro, pero es un fallo)
      throw new Error("Respuesta de verificación inválida");
    } catch (error) {
      // <-- También aplicamos el tipo aquí
      // El token es inválido o expiró.
      const axiosError = error as AxiosError;
      console.error("Fallo al verificar la sesión:", axiosError.message);
      // Nos aseguramos de limpiar por si acaso
      sessionStorage.removeItem(ADMIN_USER_KEY);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      return null;
    }
  },
  /**
   * MODIFICADO: Ahora verifica el TOKEN en sessionStorage, no localStorage.
   */

  isAuthenticated: (): boolean => {
    return !!sessionStorage.getItem(ADMIN_TOKEN_KEY);
  },
};
