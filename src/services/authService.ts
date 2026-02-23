import axios from 'axios';
import api, { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, ACCESS_TOKEN_EXPIRY_DAYS, REFRESH_TOKEN_EXPIRY_DAYS } from '../config/api';
import { setCookie, getCookie, deleteCookie } from '../utils/cookies';
import { User } from '../types';

const AUTH_COOKIE_NAME = 'opo_auth_user';
const API_BASE_URL = import.meta.env.VITE_REACT_API_BASE_URL;

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    usuario_id: number;
    nombre: string;
    email: string;
    rol_base: string;
    profesor_id: number | null;
    tipo_acceso: string;
  };
}

export const authService = {
  // Login del usuario
  async login(email: string, password: string): Promise<User | null> {
    try {
      const response = await api.post<LoginResponse>('/loginOpo', {
        email,
        password
      });

      const data = response.data;

      if (data?.accessToken && data?.user) {
        // Guardar tokens en cookies con su expiración correspondiente
        setCookie(ACCESS_TOKEN_KEY, data.accessToken, ACCESS_TOKEN_EXPIRY_DAYS);
        setCookie(REFRESH_TOKEN_KEY, data.refreshToken, REFRESH_TOKEN_EXPIRY_DAYS);

        const user: User = {
          id: data.user.usuario_id.toString(),
          username: data.user.email,
          nombre: data.user.nombre,
          profesor_id: data.user.profesor_id ? data.user.profesor_id.toString() : undefined,
          rol: data.user.tipo_acceso as 'PROFESOR' | 'ESTUDIANTE' | 'ADMINISTRADOR'
        };

        // Guardar datos del usuario en cookie (7 días, igual que el refresh token)
        setCookie(AUTH_COOKIE_NAME, user, REFRESH_TOKEN_EXPIRY_DAYS);

        return user;
      }
      return null;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // Logout del usuario (llama al backend y limpia las cookies)
  async logout(): Promise<void> {
    const refreshToken = getCookie<string>(REFRESH_TOKEN_KEY);
    try {
      if (refreshToken) {
        await axios.post(
          `${API_BASE_URL}/logoutOpo`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Error en logout (ignorado):', error);
    } finally {
      deleteCookie(ACCESS_TOKEN_KEY);
      deleteCookie(REFRESH_TOKEN_KEY);
      deleteCookie(AUTH_COOKIE_NAME);
    }
  },

  // Obtener usuario de la cookie
  getCurrentUser(): User | null {
    return getCookie<User>(AUTH_COOKIE_NAME);
  },

  // Verificar si hay sesión activa
  isAuthenticated(): boolean {
    return (
      getCookie(AUTH_COOKIE_NAME) !== null &&
      getCookie(ACCESS_TOKEN_KEY) !== null
    );
  },

  // Verificar si el usuario es profesor
  isProfesor(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'PROFESOR';
  },

  // Verificar si el usuario es estudiante
  isEstudiante(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'ESTUDIANTE';
  }
};