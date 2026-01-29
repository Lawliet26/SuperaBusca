import { useAuth } from '@/context/AuthContext';
import api from '../config/api';

export interface RevisionGrupo {
  temarioId: number;
  titulo: string; // oposicion_nombre
  temas: {
    titulo: string;
    detalles: {
      id: string;
      candidato: string;
      coincidenciaPorcentaje: number;
      notas: string;
      documentos: string[];
      estado: 'pendiente' | 'aprobado' | 'corregir';
      temaAcademiaId: number;
    }[];
  }[];
}

interface TemarioDecisionPayload {
  profesor_id: number;
  temario_id: number;
  accion: 'APROBADO' | 'CORRECCION';
  comentarios: string;
}

interface DetalleMapeoAPI {
  tema_academia_id: number;
  coincidencia_porcentaje: string;
  ley_detectada: string;
  notas: string;
  url_pdf_evidencia: string;
}

interface TemaConvocatoriaAPI {
  titulo: string;
  detalles_mapeo: DetalleMapeoAPI[];
}

interface RevisionAPIResponse {
  temario_id: number;
  oposicion_nombre: string;
  temas_convocatoria: TemaConvocatoriaAPI[];
}

export const temariosService = {
  // Obtener lista de revisiones
  async getMisTemarios(user: any): Promise<any[]> {
    // En producción, esto sería:
    const response = await api.get<any>(`/mis-temarios?usuario_id=${user.id}`);
    return response.data.dashboard_data;
  } 
};
