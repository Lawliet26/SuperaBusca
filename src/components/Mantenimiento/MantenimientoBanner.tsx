import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseOutlined, WarningOutlined } from '@ant-design/icons';
import { MantenimientoEstado } from '../../services/mantenimientoService';
import './MantenimientoBanner.css';

interface Props {
  estado: MantenimientoEstado;
}

const formatFechaHora = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('es-ES', {
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
};

const DISMISSED_KEY = 'mant_banner_dismissed';

const shakeVariants = {
  shake: {
    rotate: [0, -14, 14, -10, 10, -6, 6, 0],
    transition: {
      duration: 0.7,
      repeat: Infinity,
      repeatDelay: 3,
      ease: 'easeInOut',
    },
  },
};

const MantenimientoBanner: React.FC<Props> = ({ estado }) => {
  const dismissedAt = localStorage.getItem(DISMISSED_KEY);
  const [visible, setVisible] = useState(() => {
    if (!dismissedAt) return true;
    return dismissedAt !== estado.fecha_inicio;
  });

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, estado.fecha_inicio ?? '');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="mant-banner"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          <div className="mant-banner-inner">
            {/* Barra lateral pulsante */}
            <div className="mant-banner-accent" />

            {/* Línea de scan */}
            <div className="mant-banner-scan" />

            <div className="mant-banner-left">
              {/* Ícono con shake */}
              <motion.span
                className="mant-banner-icon-wrap"
                variants={shakeVariants}
                animate="shake"
              >
                <WarningOutlined className="mant-banner-icon" />
              </motion.span>

              <div className="mant-banner-text">
                <span className="mant-banner-title">
                  <span className="mant-banner-dot" />
                  Mantenimiento programado
                </span>
                {estado.fecha_inicio && (
                  <span className="mant-banner-sub">
                    El sistema estará temporalmente fuera de servicio el{' '}
                    <strong>{formatFechaHora(estado.fecha_inicio)}</strong>
                    {estado.fecha_fin && (
                      <> hasta las{' '}
                        <strong>
                          {new Date(estado.fecha_fin).toLocaleTimeString('es-ES', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </strong>
                      </>
                    )}.
                  </span>
                )}
              </div>
            </div>

            <button
              className="mant-banner-close"
              onClick={dismiss}
              aria-label="Cerrar aviso"
            >
              <CloseOutlined />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MantenimientoBanner;
