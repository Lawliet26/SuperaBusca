import api from '../config/api';

export interface HistorialRevision {
  revision_id: number;
  temario_id: number;
  oposicion_id: number;
  oposicion_titulo: string;
  fecha_revision: string;
}

export interface HistorialProfesor {
  profesor_id: number;
  profesor_nombre: string;
  total_revisiones: number;
  total_count?: number;
  revisiones: HistorialRevision[];
}

export interface HistorialFilters {
  start_date?: string;
  end_date?: string;
  nombre?: string;
  oposicion?: string;
  limit?: number;
  offset?: number;
  /** En modo export se pide TODO sin paginado */
  export?: boolean;
}

export const historialService = {
  async getHistorial(
    filters: HistorialFilters
  ): Promise<{ data: HistorialProfesor[]; total: number }> {
    const params: Record<string, string | number> = {};
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.nombre) params.nombre = filters.nombre;
    if (filters.oposicion) params.oposicion = filters.oposicion;

    if (filters.export) {
      // Export: sin paginado, traemos todo
      params.export = 'true';
    } else {
      params.limit = filters.limit ?? 20;
      params.offset = filters.offset ?? 0;
    }

    const response = await api.get<HistorialProfesor[]>('/historial-revisiones', { params });
    const data = Array.isArray(response.data) ? response.data : [];
    // total_count viene en cada fila (window function); si no hay filas, total 0
    const total = data.length > 0 ? (data[0].total_count ?? data.length) : 0;
    return { data, total };
  },
};
