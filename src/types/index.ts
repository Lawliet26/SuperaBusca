export interface Oposicion {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  categoriaId?: number;
  provincia: string;
  provinciaId?: number;
  fechaConvocatoria: string;
  plazas: number;
  estado: 'abierta' | 'cerrada' | 'proxima';
  urlBasesOficiales?: string;
  tieneTemarioListo?: boolean;
}


export interface User {
  profesor_id?: string;
  id: string;
  username: string;
  nombre: string;
  rol: 'PROFESOR' | 'ESTUDIANTE' | 'ADMINISTRADOR';
}

export interface Recurso {
  filename: string;
  url: string;
}

export interface TemaTemario {
  titulo_tema_oposicion: string;
  recursos: Recurso[];
}

export interface OposicionData {
  id_oposicion: number;
  titulo_oposicion: string;
  estado_solicitud: string;
  temario: TemaTemario[];
}

export interface OposicionAdmin {
  id: number;
  titulo: string;
  num_plazas: number;
  url_bases_oficiales: string;
  fecha_convocatoria: string;
  tiene_temario_listo: boolean;
  provincia_id: number;
  nombre_provincia: string;
  categoria_id: number;
  nombre_categoria: string;
  tipo: string;
  estado: string;
  municipio_id?: number;
  nombre_municipio?: string;
  fecha_fin?: string;
  observaciones?: string;
  ccaa?: string;
}
export interface Categoria {
  id: number;
  nombre: string;
}
