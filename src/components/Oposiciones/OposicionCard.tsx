import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, Modal } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  BookOutlined,
  LockOutlined,
  RightOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Oposicion } from '../../types';
import { OposicionDetailModal } from './OposicionDetailModal';

interface OposicionCardProps {
  oposicion: Oposicion;
  index: number;
  onSolicitarTemario: (id: string) => void;
}

const estadoConfig: Record<string, { color: string; bg: string; label: string; pulse: boolean }> = {
  abierta:   { color: '#23C27B', bg: 'rgba(35,194,123,0.12)',  label: 'Abierta',  pulse: true  },
  cerrada:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'Cerrada',  pulse: false },
  'en curso':{ color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'En Curso', pulse: false },
};

const tipoConfig: Record<string, { color: string; bg: string }> = {
  Convocatoria: { color: '#DFF5EC', bg: '#1E3A5F' },
  Oferta:       { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
};

const OposicionCard: React.FC<OposicionCardProps> = ({ oposicion, index, onSolicitarTemario }) => {
  const [hovered, setHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const estado = estadoConfig[oposicion.estado] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: oposicion.estado, pulse: false };
  const tipo = tipoConfig[oposicion.tipo] ?? tipoConfig.Oferta;
  const isOferta = oposicion.tipo === 'Oferta';

  const handleCardClick = () => setIsModalOpen(true);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: '¿Solicitar temario?',
      content: `Se solicitará el temario para "${oposicion.titulo}". ¿Deseas continuar?`,
      okText: 'Confirmar',
      cancelText: 'Cancelar',
      onOk: () => onSolicitarTemario(oposicion.id),
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={handleCardClick}
        style={{
          background: hovered
            ? 'linear-gradient(135deg, #0b192e 0%, #0b192e 100%)'
            : '#0b192e',
          border: hovered ? '1px solid rgba(35,194,123,0.55)' : '1px solid rgba(35,194,123,0.22)',
          borderRadius: 16,
          padding: '20px 22px',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: hovered
            ? '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(35,194,123,0.15)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          position: 'relative',
          overflow: 'hidden',
          opacity: isOferta ? 0.55 : 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {hovered && (
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 180, height: 180,
            background: 'radial-gradient(circle, rgba(35,194,123,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        )}

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: estado.bg, color: estado.color,
            border: `1px solid ${estado.color}44`,
            borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: estado.color, display: 'inline-block',
              animation: estado.pulse ? 'pulse-dot 2s infinite' : 'none',
            }} />
            {estado.label}
          </span>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: tipo.bg, color: tipo.color,
            border: `1px solid ${tipo.color}44`,
            borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
          }}>
            <FileTextOutlined style={{ fontSize: 10 }} />
            {oposicion.categoria || oposicion.tipo}
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontWeight: 700, fontSize: 15, color: '#F4FAF8',
          lineHeight: 1.35, marginBottom: 6,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
        }}>
          {oposicion.titulo}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 0' }} />

        {/* Info row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
          <Tooltip title="Provincia">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DFF5EC', fontSize: 12 }}>
              <EnvironmentOutlined style={{ color: '#23C27B', fontSize: 13 }} />
              <span>{oposicion.provincia}</span>
            </div>
          </Tooltip>

          <Tooltip title="Fecha de Convocatoria">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DFF5EC', fontSize: 12 }}>
              <CalendarOutlined style={{ color: '#f59e0b', fontSize: 13 }} />
              <span>{new Date(oposicion.fechaConvocatoria).toLocaleDateString('es-ES')}</span>
            </div>
          </Tooltip>

          <Tooltip title="Plazas Disponibles">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DFF5EC', fontSize: 12 }}>
              <TeamOutlined style={{ color: '#23C27B', fontSize: 13 }} />
              <span>{oposicion.plazas} plazas</span>
            </div>
          </Tooltip>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tooltip title={isOferta ? 'Disponible cuando se publique la convocatoria' : ''}>
            <button
              onClick={handleButtonClick}
              disabled={isOferta}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#1E3A5F',
                color: oposicion.tieneTemarioListo ? '#23C27B' : '#D0E4F7',
                border: oposicion.tieneTemarioListo ? '1px solid rgba(35,194,123,0.6)' : '1px solid rgba(35,194,123,0.35)',
                borderRadius: 8, padding: '7px 14px',
                fontSize: 12, fontWeight: 600, cursor: isOferta ? 'not-allowed' : 'pointer',
                opacity: isOferta ? 0.5 : 1,
                transition: 'color 0.2s, border-color 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {isOferta ? <LockOutlined /> : oposicion.tieneTemarioListo ? <CheckCircleOutlined style={{ color: '#23C27B' }} /> : <BookOutlined />}
              {oposicion.tieneTemarioListo ? 'Ver Convocatoria' : 'Solicitar Temario'}
            </button>
          </Tooltip>

          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            color: hovered ? '#23C27B' : 'rgba(255,255,255,0.3)',
            fontSize: 12, fontWeight: 600, transition: 'color 0.2s',
          }}>
            Ver detalle <RightOutlined style={{ fontSize: 10 }} />
          </span>
        </div>

        <style>{`
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
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
