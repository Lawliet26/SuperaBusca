import api from '../config/api';
import { Oposicion, OposicionAdmin } from '../types';

interface OposicionAPI {
  id: number;
  titulo: string;
  num_plazas: number;
  url_bases_oficiales: string;
  fecha_convocatoria: string;
  tiene_temario_listo: boolean;
  provincia_id: number;
  tipo?: string;
  nombre_provincia: string;
  categoria_id: number;
  nombre_categoria: string;
  estado?: string;
  municipio_id?: number;
  nombre_municipio?: string;
  fecha_fin?: string;
  observaciones?: string;
  ccaa?: string;
  total_count?: string; // Agregar este campo
}

interface CompararTemarioPayload {
  user_id: number;
  oposicion_id: number;
  
}

interface UpdateOposicionPayload {
  id: number;
  provincia_id?: number;
  categoria_id?: number;
  municipio_id?: number;
  tipo?: string;
  estado?: string;
  num_plazas?: number;
  url_bases_oficiales?: string;
  fecha_convocatoria?: string;
  fecha_fin?: string;
  observaciones?: string;
}

interface CreateOposicionPayload {
  provincia_nombre: string;
  categoria_nombre: string;
  ccaa?: string;
  num_plazas: number;
  url_bases_oficiales: string;
  fecha_convocatoria: string;
  tipo: string;
  provincia_id: number;
  convocante: string;
  municipio_id?: number;
  categoria_id: number;
  estado: string;
  fecha_fin?: string;
  observaciones?: string;
}

interface OposicionesAdminFilters {
  search?: string;
  provincia_id?: number;
  municipio_id?: number;
  categoria_id?: number;
  estado?: string;
  tipo?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  limit?: number;
  offset?: number;
}

export const oposicionesService = {
  async getOposiciones(): Promise<Oposicion[]> {
    try {
      const response = await api.get<OposicionAPI[]>('/lista-oposiciones');
      
      return response.data.map(item => ({
        id: item.id.toString(),
        titulo: item.titulo,
        descripcion: `${item.nombre_categoria} - ${item.nombre_provincia}`,
        categoria: item.nombre_categoria,
        categoriaId: item.categoria_id,
        provincia: item.nombre_provincia,
        provinciaId: item.provincia_id,
        fechaConvocatoria: item.fecha_convocatoria,
        plazas: item.num_plazas,
        estado: item.tiene_temario_listo ? 'abierta' : 'proxima',
        urlBasesOficiales: item.url_bases_oficiales,
        tieneTemarioListo: item.tiene_temario_listo
      }));
    } catch (error) {
      console.error('Error obteniendo oposiciones:', error);
      throw error;
    }
  },

  async compararTemario(payload: CompararTemarioPayload): Promise<void> {
    try {
      await api.post('/comparar-temario', payload);
    } catch (error) {
      console.error('Error comparando temario:', error);
      throw error;
    }
  },

  async getOposicionesAdmin(filters?: OposicionesAdminFilters): Promise<{ data: OposicionAdmin[], total: number }> {
    try {
      const params: any = {};
      
      if (filters?.search) params.search = filters.search;
      if (filters?.provincia_id) params.provincia_id = filters.provincia_id;
      if (filters?.municipio_id) params.municipio_id = filters.municipio_id;
      if (filters?.categoria_id) params.categoria_id = filters.categoria_id;
      if (filters?.estado) params.estado = filters.estado;
      if (filters?.tipo) params.tipo = filters.tipo;
      if (filters?.fecha_inicio) params.fecha_inicio = filters.fecha_inicio;
      if (filters?.fecha_fin) params.fecha_fin = filters.fecha_fin;
      
      params.limit = filters?.limit || 10;
      params.offset = filters?.offset || 0;

      const response = await api.get<OposicionAPI[]>('/lista-oposiciones', { params });
      
      // Obtener el total_count del primer elemento de la respuesta
      const totalCount = response.data.length > 0 && response.data[0].total_count 
        ? parseInt(response.data[0].total_count) 
        : 0;

      const mappedData = response.data.map(item => ({
        id: item.id,
        titulo: item.titulo,
        num_plazas: item.num_plazas,
        url_bases_oficiales: item.url_bases_oficiales,
        fecha_convocatoria: item.fecha_convocatoria,
        tiene_temario_listo: item.tiene_temario_listo,
        provincia_id: item.provincia_id,
        nombre_provincia: item.nombre_provincia,
        categoria_id: item.categoria_id,
        nombre_categoria: item.nombre_categoria,
        tipo: item.tipo || 'Convocatoria',
        estado: item.estado || 'Abierto',
        municipio_id: item.municipio_id,
        nombre_municipio: item.nombre_municipio,
        fecha_fin: item.fecha_fin,
        observaciones: item.observaciones,
        ccaa: item.ccaa
      }));

      return { data: mappedData, total: totalCount };
    } catch (error) {
      console.error('Error obteniendo oposiciones admin:', error);
      throw error;
    }
  },

  async updateOposicion(payload: UpdateOposicionPayload): Promise<void> {
    try {
      await api.patch('/lista-oposiciones', payload);
    } catch (error) {
      console.error('Error actualizando oposición:', error);
      throw error;
    }
  },

  async createOposicion(payload: CreateOposicionPayload): Promise<void> {
    try {
      await api.post('/lista-oposiciones', payload);
    } catch (error) {
      console.error('Error creando oposición:', error);
      throw error;
    }
  }
};