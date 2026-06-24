import api from '../config/api';

export interface Categoria {
  id: number;
  nombre: string;
}

export const categoriasService = {
  async getCategorias(): Promise<Categoria[]> {
    try {
      const response = await api.get<Categoria[]>('/categorias');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  },
  
  async createCategoria(nombre: string): Promise<Categoria> {
    try {
      const response = await api.post<Categoria>('/categorias', { nombre });
      return response.data;
    } catch (error) {
      console.error('Error creando categoría:', error);
      throw error;
    }
  },
  async updateCategoria(id: number, nombre: string): Promise<Categoria> {
    try {
      const response = await api.put<Categoria>(`/categorias/${id}`, { nombre });
      return response.data;
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      throw error;
    }
  },
  // Elimina una categoría. Si está en uso por oposiciones y no se pasa reassignTo,
  // el backend NO la borra y devuelve { borrado: false, en_uso }. Con reassignTo,
  // reasigna esas oposiciones al nuevo valor y luego borra.
  async deleteCategoria(
    id: number,
    reassignTo?: number
  ): Promise<{ success: boolean; borrado: boolean; en_uso: number; reasignadas: number; oposiciones?: { id: number; titulo: string }[] }> {
    const params: Record<string, number> = { id };
    if (reassignTo != null) params.reassign_to = reassignTo;
    const response = await api.delete('/eliminar-categoria', { params });
    return response.data;
  }
};