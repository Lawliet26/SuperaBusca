import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_API_BASE_URL;

export interface MantenimientoEstado {
  activo: boolean;
  titulo: string;
  descripcion: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

export const mantenimientoService = {
  async getEstado(): Promise<MantenimientoEstado | null> {
    try {
      const response = await axios.get<MantenimientoEstado | MantenimientoEstado[]>(
        `${API_BASE_URL}/mantenimiento/estado`
      );
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      return data ?? null;
    } catch {
      return null;
    }
  },
};
