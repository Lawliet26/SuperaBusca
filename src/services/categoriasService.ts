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
  }
};