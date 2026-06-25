import api from '../config/api';

export interface ProfesorActivo {
  id: number;
  nombre: string;
  especialidad: string; // compañía (Supera / Patrio)
  estado: boolean;
}

export const profesoresService = {
  // Lista de profesores activos (estado = true), para el dropdown de reasignación.
  async getProfesores(): Promise<ProfesorActivo[]> {
    const response = await api.get<ProfesorActivo[]>('/profesores');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Reasigna manualmente un temario (revisión) a un profesor.
  async reasignarProfesor(temarioId: number, profesorId: number): Promise<void> {
    await api.post('/reasignar-profesor', { temario_id: temarioId, profesor_id: profesorId });
  },
};
