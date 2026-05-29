import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { MantenimientoEstado } from '../../services/mantenimientoService';
import isotipo from '../../assets/logos/isotipo-verde.png';
import './MantenimientoPage.css';

interface Props {
  estado: MantenimientoEstado;
  onRefresh: () => void;
}

const formatFechaHora = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const WrenchIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mant-wrench-svg">
    <motion.path
      d="M52 12C47.6 7.6 41.2 6.4 35.6 8.8L44 17.2L36.8 24.4L28.4 16C25.6 21.6 27.2 28.4 31.6 32.8L14 50.4C12.8 51.6 12.8 53.6 14 54.8L17.6 58.4C18.8 59.6 20.8 59.6 22 58.4L39.6 40.8C44 44.8 50.8 46 56 43.2L47.6 34.8L54.8 27.6L63.2 36C65.6 30.4 64.4 24 60 19.6"
      stroke="#23C27B"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.4, ease: 'easeInOut' }}
    />
  </svg>
);

const MantenimientoPage: React.FC<Props> = ({ estado, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!estado.fecha_fin) return;
    const update = () => {
      const diff = new Date(estado.fecha_fin!).getTime() - Date.now();
      if (diff <= 0) { setCountdown(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [estado.fecha_fin]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className="mant-page">
      <motion.div
        className="mant-card"
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="mant-logo-row">
          <motion.img
            src={isotipo}
            alt="logo"
            className="mant-logo"
            animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
            transition={{ duration: 1.2, delay: 0.6, ease: 'easeInOut' }}
          />
        </div>

        <motion.div
          className="mant-icon-wrap"
          animate={{ rotate: [0, -12, 12, -6, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <WrenchIcon />
        </motion.div>

        <motion.h1
          className="mant-titulo"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {estado.titulo}
        </motion.h1>

        {estado.descripcion && (
          <motion.p
            className="mant-desc"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {estado.descripcion}
          </motion.p>
        )}

        <div className="mant-fechas">
          {estado.fecha_inicio && (
            <div className="mant-fecha-item">
              <span className="mant-fecha-label">Inicio</span>
              <span className="mant-fecha-valor">{formatFechaHora(estado.fecha_inicio)}</span>
            </div>
          )}
          {estado.fecha_fin && (
            <div className="mant-fecha-item">
              <span className="mant-fecha-label">Fin estimado</span>
              <span className="mant-fecha-valor">{formatFechaHora(estado.fecha_fin)}</span>
            </div>
          )}
        </div>

        {countdown && (
          <motion.div
            className="mant-countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="mant-countdown-label">Tiempo restante</span>
            <span className="mant-countdown-value">{countdown}</span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
            className="mant-btn-refresh"
          >
            Verificar disponibilidad
          </Button>
        </motion.div>

        <motion.div
          className="mant-dots"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="mant-dot"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MantenimientoPage;
