import api from '../config/api';

export interface Actividad {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  tipo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  todo_el_dia: boolean | null;
  ubicacion: string | null;
  color: string | null;
  oposicion_id: number | null;
  oposicion_nombre?: string | null;
  creado_por: number | null;
  created_at: string;
  updated_at: string;
}

export interface ActividadFilters {
  tipo?: string;
  oposicion_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface ActividadInput {
  titulo?: string | null;
  descripcion?: string | null;
  tipo?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  todo_el_dia?: boolean;
  ubicacion?: string | null;
  color?: string | null;
  oposicion_id?: number | null;
}

export const actividadesService = {
  async list(filters: ActividadFilters = {}): Promise<Actividad[]> {
    const params: Record<string, string | number> = {};
    if (filters.tipo) params.tipo = filters.tipo;
    if (filters.oposicion_id) params.oposicion_id = filters.oposicion_id;
    if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio;
    if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin;
    const res = await api.get<Actividad[]>('/actividades', { params });
    return Array.isArray(res.data) ? res.data : [];
  },

  async create(data: ActividadInput): Promise<Actividad | null> {
    const res = await api.post<Actividad[]>('/actividades', data);
    return Array.isArray(res.data) ? res.data[0] ?? null : (res.data as unknown as Actividad);
  },

  async update(id: number, data: ActividadInput): Promise<Actividad | null> {
    const res = await api.patch<Actividad[]>('/actividades', { id, ...data });
    return Array.isArray(res.data) ? res.data[0] ?? null : (res.data as unknown as Actividad);
  },

  async remove(id: number): Promise<void> {
    await api.delete('/actividades', { params: { id } });
  },
};
