import api from '../config/api';

export const recursosService = {
  async uploadRecurso(formData: FormData): Promise<void> {
    try {
      await api.post('/recursos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error('Error subiendo recurso:', error);
      throw error;
    }
  }
};