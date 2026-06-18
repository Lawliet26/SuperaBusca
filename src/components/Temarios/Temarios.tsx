import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
// Calendario oculto temporalmente
// import { CalendarioConvocatorias } from './CalendarioConvocatorias';
import { notify } from '@/utils/notify';
import { temariosService } from '@/services/temariosService';
import { OposicionData, Oposicion } from '@/types';
import { SkeletonList } from '../shared/Skeletons';
import { OposicionDetailModal } from '../Oposiciones/OposicionDetailModal';
import { useAuth } from '@/context/AuthContext';
import './Temarios.css';

// Convierte la convocatoria (enriquecida desde n8n) al shape que espera el modal de detalle
const toOposicion = (o: OposicionData): Oposicion => ({
  id: String(o.id_oposicion),
  titulo: o.titulo_oposicion,
  descripcion: o.observaciones || '',
  categoria: o.categoria || '',
  provincia: o.provincia || '',
  fechaConvocatoria: o.fecha_convocatoria || '',
  fechaFinalizacion: o.fecha_fin,
  plazas: o.num_plazas ?? 0,
  estado: o.estado === 'Abierta' ? 'abierta' : o.estado === 'Cerrada' ? 'cerrada' : 'en curso',
  urlBasesOficiales: o.url_bases_oficiales,
  urlConvocatoria: o.url_convocatoria,
  nombre_municipio: o.nombre_municipio,
  tieneTemarioListo: true,
});

export const Temarios = () => {
  const { user } = useAuth()
  const [oposiciones, setOposiciones] = useState<OposicionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionada, setSeleccionada] = useState<OposicionData | null>(null);

  useEffect(() => {
    const fetchTemarios = async () => {
      try {
        setLoading(true);
        const data = await temariosService.getMisTemarios(user);
        setOposiciones(data);
      } catch (error) {
        notify.error('Error al cargar los temarios');
      } finally {
        setLoading(false);
      }
    };

    fetchTemarios();
  }, []);

  if (loading) {
    return <SkeletonList count={5} />;
  }

  return (
    <motion.div
      className="temarios-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="temarios-content">
        <div className="temarios-header">
          <motion.h1 
            className="temarios-title"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Mis Convocatorias
          </motion.h1>
          <motion.p 
            className="temarios-subtitle"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            Revisa y evalúa los temarios de las convocatorias
          </motion.p>
        </div>
        
        {!Array.isArray(oposiciones) || oposiciones.length === 0 ? (
          <div className="temarios-empty">
            <p className="temarios-empty-text">No hay convocatorias disponibles</p>
          </div>
        ) : (
          <div className="convocatorias-grid">
            {oposiciones
              .filter((o) => o.id_oposicion != null)
              .map((o) => (
                <motion.div
                  key={o.id_oposicion}
                  className="convocatoria-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="convocatoria-card-body">
                    <span className="convocatoria-card-tag">{o.provincia || 'Convocatoria'}</span>
                    <h3 className="convocatoria-card-title">{o.titulo_oposicion}</h3>
                  </div>
                  <button
                    className="convocatoria-card-btn"
                    onClick={() => setSeleccionada(o)}
                  >
                    <FileText size={16} />
                    Ver Recursos
                  </button>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      <OposicionDetailModal
        isOpen={!!seleccionada}
        onClose={() => setSeleccionada(null)}
        oposicion={seleccionada ? toOposicion(seleccionada) : null}
        mostrarRecursos
      />
    </motion.div>
  );
};

export default Temarios;
