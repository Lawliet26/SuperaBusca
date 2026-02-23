import axios from 'axios';
import { getCookie, setCookie, deleteCookie } from '../utils/cookies';

const API_BASE_URL = import.meta.env.VITE_REACT_API_BASE_URL;

export const ACCESS_TOKEN_KEY = 'opo_access_token';
export const REFRESH_TOKEN_KEY = 'opo_refresh_token';
const AUTH_COOKIE_NAME = 'opo_auth_user';

// 15 minutos expresados en días para setCookie
const ACCESS_TOKEN_EXPIRY_DAYS = 15 / (60 * 24);
// 7 días para el refresh token
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de request: adjunta el accessToken en cada petición
api.interceptors.request.use(
  (config) => {
    const token = getCookie<string>(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag para evitar bucles infinitos de refresh
let isRefreshing = false;
let pendingRequests: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processPendingRequests = (newToken: string) => {
  pendingRequests.forEach(({ resolve }) => resolve(newToken));
  pendingRequests = [];
};

const rejectPendingRequests = (err: unknown) => {
  pendingRequests.forEach(({ reject }) => reject(err));
  pendingRequests = [];
};

const clearSession = () => {
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
  deleteCookie(AUTH_COOKIE_NAME);
};

// Interceptor de response: maneja 401 intentando renovar el token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si no es 401, rechazar directamente
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Si ya se intentó el retry en esta petición, no volver a intentar
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si el usuario no tiene sesión activa, no intentar refresh
    const userCookie = getCookie(AUTH_COOKIE_NAME);
    if (!userCookie) {
      return Promise.reject(error);
    }

    const refreshToken = getCookie<string>(REFRESH_TOKEN_KEY);

    // Sin refresh token: limpiar sesión y redirigir
    if (!refreshToken) {
      clearSession();
      window.location.href = '/';
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar la petición
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve: (newToken: string) => {
            // BUG FIX: marcar _retry para evitar nuevo ciclo si esta petición también falla
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Llamada directa con axios para evitar ciclos en el interceptor
      const { data } = await axios.post(
        `${API_BASE_URL}/refreshOpo`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const newAccessToken: string = data.accessToken;
      setCookie(ACCESS_TOKEN_KEY, newAccessToken, ACCESS_TOKEN_EXPIRY_DAYS);

      // BUG FIX: liberar el flag ANTES de procesar las encoladas para no bloquear
      isRefreshing = false;
      processPendingRequests(newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh falló: rechazar las encoladas, limpiar sesión y redirigir
      isRefreshing = false;
      rejectPendingRequests(refreshError);
      clearSession();
      window.location.href = '/';
      return Promise.reject(refreshError);
    }
  }
);

export { ACCESS_TOKEN_EXPIRY_DAYS, REFRESH_TOKEN_EXPIRY_DAYS };
export default api;