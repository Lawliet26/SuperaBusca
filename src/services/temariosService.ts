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
  // La identidad se resuelve en n8n desde el JWT (jwtPayload.userId), no desde la URL.
  // No enviamos usuario_id: el backend ignora cualquier parámetro y devuelve solo lo del dueño del token.
  async getMisTemarios(): Promise<any[]> {
    const response = await api.get<any>('/mis-temarios');
    const dashboard = response?.data?.[0]?.dashboard_data;
    return Array.isArray(dashboard) ? dashboard : [];
  }
};
