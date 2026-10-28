import api from '../config/api';
import type { OrigenTabla } from './fichasPublicacionService';

// Bandeja de boletines: lo que el scraper diario deja en oporadar.scraper_hallazgos_crudos.
// Los endpoints leen de oporadar.v_bandeja_boletines y escriben con bandeja_promover() /
// bandeja_vincular() / bandeja_descartar() / bandeja_reabrir() (ver db/bandeja-boletines).
// Solo ADMINISTRADOR, validado en el backend; el "revisado_por" lo pone el backend desde el JWT.

export type EstadoRevision = 'pendiente' | 'promovido' | 'vinculado' | 'descartado';
export type TipoRegistro = 'oferta' | 'convocatoria';

export interface FichaConocida {
  tabla: OrigenTabla;
  id: string;
}

export interface HallazgoBandeja {
  id: number;
  source_id: string;
  boletin: string;
  ambito: string | null;
  ccaa: string | null;
  provincia: string | null;
  publication_id: string;
  fecha_publicacion: string;
  url: string;
  seccion: string | null;
  ruta: string | null;
  proposito: string | null;
  datos_personales: boolean;
  paginas: number | null;
  paginas_categoria: number[] | null;
  menciona_categoria: boolean;
  estado_lectura: string;
  estado_revision: EstadoRevision;
  revisado_por: string | null;
  revisado_en: string | null;
  nota_revision: string | null;
  destino_tabla: OrigenTabla | null;
  destino_id: string | null;
  primera_vez: string;
  ultima_vez: string;
  veces_visto: number;
  conocido_en: FichaConocida[];
  total_count?: string;
}

export interface BoletinFuente {
  source_id: string;
  nombre: string;
  ambito: string;
  ccaa: string | null;
  provincia: string | null;
  url: string | null;
  en_recorrido: boolean;
  pendientes: number | string;
}

export interface BandejaFilters {
  estado?: EstadoRevision;
  source_id?: string;
  desde?: string; // YYYY-MM-DD
  hasta?: string;
  relevantes?: boolean;
  sin_personales?: boolean;
  conocido?: 'si' | 'no';
  search?: string;
  limit?: number;
  offset?: number;
}

// Datos que escribe la persona que promueve; el scraper no los extrae.
export interface PromoverPayload {
  organismo: string;
  cuerpo_categoria: string;
  provincia: string;
  tipo_registro: TipoRegistro;
  municipio?: string | null;
  ccaa?: string | null;
  convocante?: string | null;
  acceso?: string | null;
  estado?: string | null;
  plazas_num?: number | null;
  nota?: string | null;
}

// Postgres/n8n puede devolver jsonb y arrays como string; los normalizamos.
const parseJson = <T,>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

const parseIntArray = (value: unknown): number[] | null => {
  if (value == null) return null;
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value === 'string' && value.startsWith('{')) {
    // formato texto de Postgres: {2,3}
    return value.slice(1, -1).split(',').filter(Boolean).map(Number);
  }
  return null;
};

const normalizeHallazgo = (h: HallazgoBandeja): HallazgoBandeja => ({
  ...h,
  id: Number(h.id),
  paginas_categoria: parseIntArray(h.paginas_categoria),
  conocido_en: parseJson<FichaConocida[]>(h.conocido_en, []),
});

export const bandejaBoletinesService = {
  async getHallazgos(filters: BandejaFilters = {}): Promise<{ data: HallazgoBandeja[]; total: number }> {
    try {
      const params: Record<string, string | number> = {
        limit: filters.limit ?? 20,
        offset: filters.offset ?? 0,
      };
      if (filters.estado) params.estado = filters.estado;
      if (filters.source_id) params.source_id = filters.source_id;
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;
      if (filters.relevantes) params.relevantes = 1;
      if (filters.sin_personales) params.sin_personales = 1;
      if (filters.conocido) params.conocido = filters.conocido;
      if (filters.search) params.search = filters.search;
      const response = await api.get<HallazgoBandeja[]>('/bandeja-boletines', { params });
      const total = response.data.length > 0 && response.data[0].total_count
        ? parseInt(response.data[0].total_count)
        : 0;
      return { data: response.data.map(normalizeHallazgo), total };
    } catch (error) {
      console.error('Error obteniendo la bandeja de boletines:', error);
      throw error;
    }
  },

  async getBoletines(): Promise<BoletinFuente[]> {
    try {
      const response = await api.get<BoletinFuente[]>('/boletines-fuente');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo los boletines:', error);
      throw error;
    }
  },

  async promover(crudoId: number, datos: PromoverPayload): Promise<{ id_hallazgo: string }> {
    try {
      const response = await api.post<{ success: boolean; id_hallazgo: string }>('/bandeja-promover', {
        crudo_id: crudoId,
        datos,
      });
      return { id_hallazgo: response.data.id_hallazgo };
    } catch (error) {
      console.error('Error promoviendo hallazgo:', error);
      throw error;
    }
  },

  async vincular(crudoId: number, tabla: OrigenTabla, fichaId: string, nota?: string): Promise<void> {
    try {
      await api.post('/bandeja-vincular', { crudo_id: crudoId, tabla, ficha_id: fichaId, nota: nota || null });
    } catch (error) {
      console.error('Error vinculando hallazgo:', error);
      throw error;
    }
  },

  async descartar(ids: number[], nota?: string): Promise<{ descartados: number }> {
    try {
      const response = await api.post<{ success: boolean; descartados: number }>('/bandeja-descartar', {
        ids,
        nota: nota || null,
      });
      return { descartados: Number(response.data.descartados) };
    } catch (error) {
      console.error('Error descartando hallazgos:', error);
      throw error;
    }
  },

  async reabrir(crudoId: number): Promise<void> {
    try {
      await api.post('/bandeja-reabrir', { crudo_id: crudoId });
    } catch (error) {
      console.error('Error reabriendo hallazgo:', error);
      throw error;
    }
  },
};
