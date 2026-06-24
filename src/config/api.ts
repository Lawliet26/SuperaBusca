import axios from 'axios';
import { getCookie, deleteCookie } from '../utils/cookies';

const API_BASE_URL = import.meta.env.VITE_REACT_API_BASE_URL;

export const ACCESS_TOKEN_KEY = 'opo_access_token';
export const REFRESH_TOKEN_KEY = 'opo_refresh_token';
const AUTH_COOKIE_NAME = 'opo_auth_user';

// 1 día para el access token
const ACCESS_TOKEN_EXPIRY_DAYS = 1;
// 30 días para el refresh token
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

const clearSession = () => {
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
  deleteCookie(AUTH_COOKIE_NAME);
};

// n8n devuelve [{}] (un array con un único objeto vacío) cuando un endpoint no tiene
// resultados, por el respondWith=allIncomingItems + alwaysOutputData. Eso provoca que
// los componentes reciban items "fantasma" y se caigan al mapearlos o leer propiedades.
// Lo normalizamos globalmente: toda respuesta tipo array se limpia de objetos vacíos.
const isEmptyObject = (val: unknown): boolean =>
  val != null &&
  typeof val === 'object' &&
  !Array.isArray(val) &&
  Object.keys(val as Record<string, unknown>).length === 0;

// Interceptor de response: normaliza arrays vacíos de n8n y maneja el 401.
// SIN refresh de token: si el access token expira o es inválido, se cierra la sesión y
// se vuelve al login. La vida de la sesión la define el TTL del token (8h) + el cierre
// por inactividad del frontend (ver AuthContext: actividad la mantiene, inactividad la corta).
api.interceptors.response.use(
  (response) => {
    if (Array.isArray(response.data)) {
      response.data = response.data.filter((item) => !isEmptyObject(item));
    }
    return response;
  },
  (error) => {
    // 401/403 puede ser por TOKEN (expirado/inválido/mal formado → cerrar sesión) o por
    // AUTORIZACIÓN de negocio (ej: un no-admin intenta borrar → 403 con { success:false }).
    // Los errores de negocio (traen `success`) NO cierran sesión: se propagan para mostrarlos.
    const status = error.response?.status;
    const data = error.response?.data;
    const esErrorDeNegocio = data && typeof data === 'object' && 'success' in (data as object);
    if ((status === 401 || status === 403) && !esErrorDeNegocio && getCookie(AUTH_COOKIE_NAME)) {
      clearSession();
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export { ACCESS_TOKEN_EXPIRY_DAYS, REFRESH_TOKEN_EXPIRY_DAYS };
export default api;