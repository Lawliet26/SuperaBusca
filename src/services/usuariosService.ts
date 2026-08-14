import api from '../config/api';

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  oposiciones: Record<string, string>;
  total_count?: string;
  // true = creado en OpoRadar (se puede eliminar); false/undefined = vino de SuperaBusca.
  pertenece_app?: boolean;
  // Línea del alumno (supera / patrio).
  company_organization?: string | null;
  dni?: string | null;
}

export interface ActualizarUsuarioPayload {
  usuario_id: number;
  nombre?: string;
  email?: string;
  dni?: string;
  company_organization?: string;
  especialidad?: string; // solo profesor
}

interface UsuariosFilters {
  search?: string;
  rol?: string;
  limit?: number;
  offset?: number;
}

// El admin solo puede crear ALUMNO o PROFESOR. ADMINISTRADOR es exclusivo de
// desarrollo (no se expone en el front) y el backend lo rechaza igualmente.
export type RolCreable = 'ALUMNO' | 'PROFESOR';

export interface CrearUsuarioPayload {
  email: string;
  nombre: string;
  password: string;
  rol: RolCreable;
  especialidad?: string; // obligatorio solo para PROFESOR
  company_organization?: string; // línea (supera/patrio)
  dni?: string;
}

export const usuariosService = {
  async getUsuarios(filters?: UsuariosFilters): Promise<{ data: UsuarioAdmin[]; total: number }> {
    const params: Record<string, string | number> = {
      limit: filters?.limit || 10,
      offset: filters?.offset || 0,
    };
    if (filters?.search) params.search = filters.search;
    if (filters?.rol) params.rol = filters.rol;

    const response = await api.get<UsuarioAdmin[]>('/supera-users', { params });
    const total = response.data.length > 0 && response.data[0].total_count
      ? parseInt(response.data[0].total_count)
      : response.data.length;
    return {
      data: response.data,
      total,
    };
  },

  // Crear usuario (ALUMNO o PROFESOR). El backend hashea la contraseña con bcrypt
  // y, si es PROFESOR, crea además la fila en `profesores` con la especialidad.
  async crearUsuario(payload: CrearUsuarioPayload): Promise<UsuarioAdmin | undefined> {
    const response = await api.post<{ success: boolean; usuario?: UsuarioAdmin }>(
      '/crear-usuario',
      payload
    );
    return response.data?.usuario;
  },

  // Cambiar la contraseña de un usuario (no aplica a administradores).
  async cambiarPassword(usuarioId: number, password: string): Promise<void> {
    await api.post('/cambiar-password', { usuario_id: usuarioId, password });
  },

  // Actualizar un usuario creado en OpoRadar (pertenece_app = true). El backend
  // rechaza los que vienen de SuperaBusca.
  async actualizarUsuario(
    payload: ActualizarUsuarioPayload
  ): Promise<{ success: boolean; message: string; usuario?: UsuarioAdmin }> {
    const res = await api.put<{ success: boolean; message: string; usuario?: UsuarioAdmin }>(
      '/actualizar-usuario',
      payload
    );
    return res.data;
  },

  // Eliminar un usuario. El backend solo borra los creados en OpoRadar
  // (pertenece_app = true) y hace la cascada (profesor, revisiones, solicitudes).
  async eliminarUsuario(usuarioId: number): Promise<{ success: boolean; message: string }> {
    const res = await api.delete<{ success: boolean; message: string }>('/eliminar-usuario', {
      params: { usuario_id: usuarioId },
    });
    return res.data;
  },
};