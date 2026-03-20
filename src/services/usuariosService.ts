import api from '../config/api';

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  oposiciones: Record<string, string>;
  total_count?: string;
}

interface UsuariosFilters {
  search?: string;
  rol?: string;
  limit?: number;
  offset?: number;
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
};