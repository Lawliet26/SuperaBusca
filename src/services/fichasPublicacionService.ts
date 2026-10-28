import api from '../config/api';

// Publicación de fichas del scraper (registro_unico / hallazgos_boletines) al catálogo.
// Los endpoints leen de oporadar.v_fichas_publicacion / v_conciliacion_catalogo y
// escriben con oporadar.aprobar_y_publicar() / vincular_oposicion()
// (ver db/publicacion-catalogo). Solo ADMINISTRADOR, validado en el backend;
// el "aprobado_por" lo pone el backend desde el JWT, nunca el cliente.

export type OrigenTabla = 'registro_unico' | 'hallazgos_boletines';
export type SituacionFicha = 'lista' | 'incompleta' | 'publicada';

export interface EnlaceFicha {
  texto: string;
  url: string;
}

export interface FichaPublicacion {
  origen_tabla: OrigenTabla;
  origen_id: string;
  organismo: string | null;
  cuerpo_categoria: string | null;
  provincia: string | null;
  municipio: string | null;
  estado_ficha: string | null;
  plazas_ficha: string | null;
  acceso: string | null;
  fecha_publicacion_convocatoria: string | null;
  bases_links: EnlaceFicha[] | null;
  convocatoria_enlace_links: EnlaceFicha[] | null;

  propuesta_titulo: string | null;
  propuesta_num_plazas: number | null;
  propuesta_estado: string | null;
  propuesta_tipo: string | null;
  propuesta_categoria_id: number | null;
  propuesta_provincia_id: number | null;
  propuesta_municipio_id: number | null;
  propuesta_fecha_fin: string | null;
  propuesta_url_bases: string | null;
  propuesta_url_convocatoria: string | null;
  problemas: string[];

  aprobacion_compania: string | null;
  aprobacion_estado: string | null;
  aprobacion_num_plazas: number | null;
  aprobacion_provincia_id: number | null;
  aprobacion_municipio_id: number | null;
  aprobacion_categoria_id: number | null;
  aprobacion_titulo: string | null;
  aprobacion_sincronizar: boolean | null;
  aprobado_por: string | null;
  aprobado_en: string | null;

  oposicion_id: number | null;
  sincronizado_en: string | null;
  situacion: SituacionFicha;
  total_count?: string;
}

export interface FichasFilters {
  situacion?: SituacionFicha;
  origen_tabla?: OrigenTabla;
  search?: string;
  limit?: number;
  offset?: number;
}

// Overrides: null = usar lo que diga la ficha.
export interface PublicarFichaPayload {
  origen_tabla: OrigenTabla;
  origen_id: string;
  compania: string;
  estado: 'Abierta' | 'Cerrada' | null;
  num_plazas: number | null;
  provincia_id: number | null;
  municipio_id: number | null;
  categoria_id: number | null;
  titulo: string | null;
  sincronizar: boolean;
}

export interface CandidatoConciliacion {
  oposicion_id: number;
  titulo: string;
  categoria_id: number | null;
  compania: string | null;
  url_convocatoria: string;
  origen_tabla: OrigenTabla;
  origen_id: string;
  organismo: string | null;
  cuerpo_categoria: string | null;
  acceso: string | null;
  categoria_coincide: boolean;
  candidatos: number | string;
  ficha_ya_vinculada: boolean;
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

const parsePgArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string' && value.startsWith('{')) {
    // formato texto de Postgres: {"a","b"}
    return value
      .slice(1, -1)
      .match(/"((?:[^"\\]|\\.)*)"|[^,]+/g)
      ?.map((s) => (s.startsWith('"') ? s.slice(1, -1).replace(/\\(.)/g, '$1') : s)) ?? [];
  }
  return [];
};

const normalizeFicha = (f: FichaPublicacion): FichaPublicacion => ({
  ...f,
  bases_links: parseJson<EnlaceFicha[] | null>(f.bases_links, null),
  convocatoria_enlace_links: parseJson<EnlaceFicha[] | null>(f.convocatoria_enlace_links, null),
  problemas: parsePgArray(f.problemas),
});

export const fichasPublicacionService = {
  async getFichas(filters: FichasFilters = {}): Promise<{ data: FichaPublicacion[]; total: number }> {
    try {
      const params: Record<string, string | number> = {
        limit: filters.limit ?? 20,
        offset: filters.offset ?? 0,
      };
      if (filters.situacion) params.situacion = filters.situacion;
      if (filters.origen_tabla) params.origen_tabla = filters.origen_tabla;
      if (filters.search) params.search = filters.search;

      const response = await api.get<FichaPublicacion[]>('/fichas-publicacion', { params });
      const total = response.data.length > 0 && response.data[0].total_count
        ? parseInt(response.data[0].total_count)
        : 0;
      return { data: response.data.map(normalizeFicha), total };
    } catch (error) {
      console.error('Error obteniendo fichas para publicar:', error);
      throw error;
    }
  },

  async publicarFicha(payload: PublicarFichaPayload): Promise<{ oposicion_id: number }> {
    try {
      const response = await api.post<{ success: boolean; oposicion_id: number }>('/publicar-ficha', payload);
      return { oposicion_id: response.data.oposicion_id };
    } catch (error) {
      console.error('Error publicando ficha:', error);
      throw error;
    }
  },

  async getConciliacion(): Promise<CandidatoConciliacion[]> {
    try {
      const response = await api.get<CandidatoConciliacion[]>('/conciliacion-catalogo');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo conciliación del catálogo:', error);
      throw error;
    }
  },

  async vincularOposicion(oposicionId: number, origenTabla: OrigenTabla, origenId: string): Promise<void> {
    try {
      await api.post('/vincular-oposicion', {
        oposicion_id: oposicionId,
        origen_tabla: origenTabla,
        origen_id: origenId,
      });
    } catch (error) {
      console.error('Error vinculando oposición:', error);
      throw error;
    }
  },
};
