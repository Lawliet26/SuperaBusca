import api from '../config/api';

export interface Provincia {
  id: number;
  nombre: string;
}
export const provinciasService = {
  async getProvincias(): Promise<Provincia[]> {
    try {
      const response = await api.get<Provincia[]>('/provincias');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo provincias:', error);
      throw error;
    }
  },
  async createProvincia(nombre: string): Promise<Provincia> {
    try {
      const response = await api.post<Provincia>('/provincias', { nombre });
      return response.data;
    } catch (error) {
      console.error('Error creando provincia:', error);
      throw error;
    }
  },
  async updateProvincia(id: number, nombre: string): Promise<Provincia> {
    try {
      const response = await api.put<Provincia>(`/provincias/${id}`, { nombre });
      return response.data;
    } catch (error) {
      console.error('Error actualizando provincia:', error);
      throw error;
    }
  },
  async deleteProvincia(
    id: number,
    reassignTo?: number
  ): Promise<{ success: boolean; borrado: boolean; en_uso: number; reasignadas: number; oposiciones?: { id: number; titulo: string }[] }> {
    const params: Record<string, number> = { id };
    if (reassignTo != null) params.reassign_to = reassignTo;
    const response = await api.delete('/eliminar-provincia', { params });
    return response.data;
  }
};