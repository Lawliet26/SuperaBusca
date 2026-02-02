import api from '../config/api';
import { setCookie, getCookie, deleteCookie } from '../utils/cookies';
import { User } from '../types';

interface LoginResponse {
  profesor_id: number;
  usuario_id: number;
  nombre: string;
  email: string;
  rol_base: string;
  tipo_acceso: string;
}

const AUTH_COOKIE_NAME = 'opo_auth_user';

export const authService = {
  // Login del usuario
  async login(email: string, password: string): Promise<User | null> {
    try {
      const response = await api.post<LoginResponse[]>('/login', {
        email,
        password
      });

      if (response.data && response.data.length > 0) {
        const userData = response.data[0];

        const user: User = {
          id: userData.usuario_id.toString(),
          username: userData.email,
          nombre: userData.nombre,
          profesor_id: userData.profesor_id ? userData.profesor_id.toString() : undefined,
          rol: userData.tipo_acceso as 'PROFESOR' | 'ESTUDIANTE'
        };

        // Guardar usuario en cookie encriptada
        setCookie(AUTH_COOKIE_NAME, user, 7);

        return user;
      }
      return null;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // Logout del usuario
  logout(): void {
    deleteCookie(AUTH_COOKIE_NAME);
  },

  // Obtener usuario de la cookie
  getCurrentUser(): User | null {
    return getCookie<User>(AUTH_COOKIE_NAME);
  },

  // Verificar si hay sesión activa
  isAuthenticated(): boolean {
    return getCookie(AUTH_COOKIE_NAME) !== null;
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
