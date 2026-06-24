import api from '../config/api';

export interface Municipio {
  id: number;
  nombre: string;
  provincia_id?: number;
}
export const municipiosService = {
  async getMunicipios(): Promise<Municipio[]> {
    try {
      const response = await api.get<Municipio[]>('/municipios');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo municipios:', error);
      throw error;
    }
  },
  async createMunicipio(nombre: string): Promise<Municipio> {
    try {
      const response = await api.post<Municipio>('/municipios', { nombre });
      return response.data;
    } catch (error) {
      console.error('Error creando municipio:', error);
      throw error;
    }
  },
  async updateMunicipio(id: number, nombre: string): Promise<Municipio> {
    try {
      const response = await api.put<Municipio>(`/municipios/${id}`, { nombre });
      return response.data;
    } catch (error) {
      console.error('Error actualizando municipio:', error);
      throw error;
    }
  },
  async deleteMunicipio(
    id: number,
    reassignTo?: number
  ): Promise<{ success: boolean; borrado: boolean; en_uso: number; reasignadas: number; oposiciones?: { id: number; titulo: string }[] }> {
    const params: Record<string, number> = { id };
    if (reassignTo != null) params.reassign_to = reassignTo;
    const response = await api.delete('/eliminar-municipio', { params });
    return response.data;
  }
};