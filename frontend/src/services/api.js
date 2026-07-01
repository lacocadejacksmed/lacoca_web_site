import axios from 'axios';
import Swal from 'sweetalert2';

export const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores 401 (token expirado o inválido)
let isAlertShown = false; // Prevent multiple alerts on concurrent requests

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      
      if (!window.location.pathname.includes('/login') && !isAlertShown) {
        isAlertShown = true;
        const isExpired = error.response.data?.expired;
        
        Swal.fire({
          icon: 'warning',
          title: isExpired ? 'Sesión Expirada' : 'Acceso Denegado',
          text: isExpired ? 'Tu sesión ha expirado por seguridad. Vuelve a iniciar sesión.' : 'No tienes permisos o tu token es inválido.',
          confirmButtonColor: '#F2641A',
          confirmButtonText: 'Ir al Login'
        }).then(() => {
          window.location.href = '/login';
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
