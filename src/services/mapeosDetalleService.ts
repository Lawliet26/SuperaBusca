import api from '../config/api';

export interface MapeoDetalle {
  id: number;
  tema_convocatoria_titulo: string;
  tema_academia_id: number;
  coincidencia_porcentaje: number;
  notas: string;
  creado_en?: string;
}

interface CreateMapeoDetallePayload {
  temario_id: number;
  tema_convocatoria_titulo: string;
  notas: string;
}

interface UpdateMapeoDetallePayload {
  id: number;
  tema_convocatoria_titulo?: string;
  notas?: string;
}

export const mapeosDetalleService = {
  async create(payload: CreateMapeoDetallePayload): Promise<MapeoDetalle> {
    const response = await api.post<{ data: MapeoDetalle }>('/mapeos-detalle', payload);
    return response.data.data;
  },

  async update(payload: UpdateMapeoDetallePayload): Promise<MapeoDetalle> {
    const response = await api.patch<{ data: MapeoDetalle }>('/mapeos-detalle', payload);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete('/mapeos-detalle', { params: { id } });
  }
};
