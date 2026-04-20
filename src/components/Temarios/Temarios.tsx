import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OposicionAccordion } from './OposicionAccordion';
import { notify } from '@/utils/notify';
import { temariosService } from '@/services/temariosService';
import { OposicionData } from '@/types';
import { SkeletonList } from '../shared/Skeletons';
import { useAuth } from '@/context/AuthContext';
import './Temarios.css';

export const Temarios = () => {
  const { user } = useAuth()
  const [oposiciones, setOposiciones] = useState<OposicionData[]>([]);
  const [loading, setLoading] = useState(true);

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
        
        {Array.isArray(oposiciones) && oposiciones.length === 0 ? (
          <div className="temarios-empty">
            <p className="temarios-empty-text">No hay convocatorias disponibles</p>
          </div>
        ) : (
          <OposicionAccordion oposiciones={oposiciones} />
        )}
      </div>
    </motion.div>
  );
};

export default Temarios;
