import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Instancia de axios configurada
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para agregar headers (excepto para FormData)
api.interceptors.request.use(
  (config) => {
    // Si no es FormData, agregar Content-Type JSON
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
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
    console.error('❌ Error en la API:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    });
    return Promise.reject(error);
  }
);

export default api;

