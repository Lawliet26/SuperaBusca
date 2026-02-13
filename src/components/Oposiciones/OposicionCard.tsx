import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Tag, Button, Tooltip } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  BookOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Oposicion } from '../../types';
import './OposicionCard.css';
import { OposicionDetailModal } from './OposicionDetailModal';

interface OposicionCardProps {
  oposicion: Oposicion;
  index: number;
  onSolicitarTemario: (id: string) => void;
}

const OposicionCard: React.FC<OposicionCardProps> = ({ oposicion, index, onSolicitarTemario }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const countdown = useMemo(() => {
    if (!oposicion.fechaFinalizacion) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const fin = new Date(oposicion.fechaFinalizacion);
    fin.setHours(0, 0, 0, 0);
    const diffMs = fin.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { days: 0, label: 'Finalizada', urgency: 'expired' as const };
    if (diffDays === 0) return { days: 0, label: 'Finaliza hoy', urgency: 'critical' as const };
    if (diffDays === 1) return { days: 1, label: '1 dia restante', urgency: 'critical' as const };
    if (diffDays <= 3) return { days: diffDays, label: `${diffDays} dias restantes`, urgency: 'danger' as const };
    if (diffDays <= 7) return { days: diffDays, label: `${diffDays} dias restantes`, urgency: 'warning' as const };
    return null;
  }, [oposicion.fechaFinalizacion]);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'abierta':
        return '#22c55e';
      case 'cerrada':
        return '#ef4444';
      case 'en curso':
        return '#f59e0b';
      default:
        return '#94a3b8';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'abierta':
        return 'Abierta';
      case 'cerrada':
        return 'Cerrada';
      case 'en curso':
        return 'En Curso';
      default:
        return estado;
    }
  };

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Previene que se abra el modal
    onSolicitarTemario(oposicion.id);
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ y: -8 }}
      >
        <Card className="oposicion-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
          <div className="card-header">
            <Tag
              color={getEstadoColor(oposicion.estado)}
              className="estado-tag"
            >
              {getEstadoLabel(oposicion.estado)}
            </Tag>
            <Tag className="estado-tag">{oposicion.categoria}</Tag>
          </div>

          {/* <AnimatePresence>
            {countdown && (
              <motion.div
                className={`countdown-banner countdown-${countdown.urgency}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <ClockCircleOutlined className="countdown-icon" />
                <span className="countdown-text">{countdown.label}</span>
              </motion.div>
            )}
          </AnimatePresence> */}

          <h3 className="card-title">{oposicion.titulo}</h3>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="card-info">
              <Tooltip title="Provincia">
                <div className="info-item">
                  <EnvironmentOutlined />
                  <span>{oposicion.provincia}</span>
                </div>
              </Tooltip>

              <Tooltip title="Fecha de Convocatoria">
                <div className="info-item">
                  <CalendarOutlined />
                  <span>{new Date(oposicion.fechaConvocatoria).toLocaleDateString('es-ES')}</span>
                </div>
              </Tooltip>

              {/* {oposicion.fechaFinalizacion && (
                <Tooltip title="Fecha de Finalización">
                  <div className="info-item">
                    <CalendarOutlined />
                    <span>{new Date(oposicion.fechaFinalizacion).toLocaleDateString('es-ES')}</span>
                  </div>
                </Tooltip>
              )} */}

              <Tooltip title="Plazas Disponibles">
                <div className="info-item">
                  <TeamOutlined />
                  <span>{oposicion.plazas} plazas</span>
                </div>
              </Tooltip>
            </div>
            <Button
              type="primary"
              icon={<BookOutlined />}
              className={oposicion.tieneTemarioListo ? "guardar-btn" : "solicitar-btn"}
              onClick={handleButtonClick}
              block
            >
              {oposicion.tieneTemarioListo ? "Agregar a mis Convocatorias" : "Solicitar Temario"}
            </Button>
          </motion.div>
        </Card>
      </motion.div>

      <OposicionDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        oposicion={oposicion}
      />
    </>
  );
};

export default OposicionCard;