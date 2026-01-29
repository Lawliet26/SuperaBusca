import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OposicionAccordion } from './OposicionAccordion';
import { useToast } from '@/hooks/use-toast';
import { temariosService } from '@/services/temariosService';
import { OposicionData } from '@/types';
import { Spin } from 'antd';
import { useAuth } from '@/context/AuthContext';
import './Temarios.css';

export const Temarios = () => {
  const { toast } = useToast();
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
        toast({
          title: 'Error',
          description: 'Error al cargar los temarios',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTemarios();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Spin size="large" tip="Cargando tus temarios..." />
      </div>
    );
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
            Mis Temarios
          </motion.h1>
          <motion.p 
            className="temarios-subtitle"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            Revisa y evalúa los temarios de las oposiciones
          </motion.p>
        </div>
        
        {Array.isArray(oposiciones) && oposiciones.length === 0 ? (
          <div className="temarios-empty">
            <p className="temarios-empty-text">No hay temarios disponibles</p>
          </div>
        ) : (
          <OposicionAccordion oposiciones={oposiciones} />
        )}
      </div>
    </motion.div>
  );
};

export default Temarios;
