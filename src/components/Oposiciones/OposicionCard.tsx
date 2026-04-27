import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, Modal, Button, Upload } from 'antd';
import type { UploadFile } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  BookOutlined,
  LockOutlined,
  RightOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  FilePdfOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Oposicion } from '../../types';
import { OposicionDetailModal } from './OposicionDetailModal';

interface OposicionCardProps {
  oposicion: Oposicion;
  index: number;
  onSolicitarTemario: (id: string, file: File) => Promise<void>;
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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const estado = estadoConfig[oposicion.estado] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: oposicion.estado, pulse: false };
  const tipo = tipoConfig[oposicion.tipo] ?? tipoConfig.Oferta;
  const isOferta = oposicion.tipo === 'Oferta';
  const hasTemario = oposicion.tieneTemarioListo;

  const handleCardClick = () => setIsModalOpen(true);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPdfFile(null);
    setFileList([]);
    setIsUploadModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!pdfFile) return;
    setSubmitting(true);
    try {
      await onSolicitarTemario(oposicion.id, pdfFile);
      setIsUploadModalOpen(false);
      setPdfFile(null);
      setFileList([]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsUploadModalOpen(false);
    setPdfFile(null);
    setFileList([]);
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
            {oposicion.tipo}
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
                color: hasTemario ? '#23C27B' : '#D0E4F7',
                border: hasTemario ? '1px solid rgba(35,194,123,0.6)' : '1px solid rgba(35,194,123,0.35)',
                borderRadius: 8, padding: '7px 14px',
                fontSize: 12, fontWeight: 600, cursor: isOferta ? 'not-allowed' : 'pointer',
                opacity: isOferta ? 0.5 : 1,
                transition: 'color 0.2s, border-color 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {isOferta ? <LockOutlined /> : hasTemario ? <CheckCircleOutlined style={{ color: '#23C27B' }} /> : <BookOutlined />}
              {hasTemario ? 'Ver Convocatoria' : 'Solicitar Temario'}
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

      {/* Modal de detalle */}
      <OposicionDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        oposicion={oposicion}
      />

      {/* Modal de solicitud con upload de comprobante */}
      <Modal
        open={isUploadModalOpen}
        onCancel={handleCancel}
        title={
          <span style={{ color: '#1a2332', fontWeight: 700 }}>
            {hasTemario ? '¿Agregar a mis Convocatorias?' : '¿Solicitar temario?'}
          </span>
        }
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancelar
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={submitting}
            disabled={!pdfFile}
            onClick={handleConfirm}
            style={{ background: '#1E3A5F', borderColor: '#1E3A5F' }}
          >
            {hasTemario ? 'Agregar' : 'Confirmar'}
          </Button>,
        ]}
        width={440}
      >
        <p style={{ color: '#4a5568', marginBottom: 20, fontSize: 14 }}>
          {hasTemario
            ? `"${oposicion.titulo}" tiene el temario listo. Para continuar, adjuntá el comprobante de pago de tasas.`
            : `Para solicitar el temario de "${oposicion.titulo}", adjuntá el comprobante de pago de tasas.`}
        </p>

        <div style={{
          border: `2px dashed ${pdfFile ? 'rgba(35,194,123,0.6)' : 'rgba(0,0,0,0.15)'}`,
          borderRadius: 10,
          padding: '16px',
          background: pdfFile ? 'rgba(35,194,123,0.04)' : 'rgba(0,0,0,0.02)',
          transition: 'all 0.2s',
        }}>
          {pdfFile ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FilePdfOutlined style={{ fontSize: 22, color: '#ef4444' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1a2332' }}>{pdfFile.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {(pdfFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setPdfFile(null); setFileList([]); }}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: '#94a3b8', padding: 4, display: 'flex', alignItems: 'center',
                }}
              >
                <DeleteOutlined />
              </button>
            </div>
          ) : (
            <Upload
              accept=".pdf"
              maxCount={1}
              showUploadList={false}
              fileList={fileList}
              beforeUpload={(file) => {
                setPdfFile(file as unknown as File);
                setFileList([{ uid: '-1', name: file.name, status: 'done' }]);
                return false;
              }}
              style={{ display: 'block', width: '100%' }}
            >
              <div style={{ textAlign: 'center', cursor: 'pointer', padding: '8px 0', width: '100%' }}>
                <UploadOutlined style={{ fontSize: 24, color: '#94a3b8', marginBottom: 8, display: 'block' }} />
                <div style={{ fontSize: 13, color: '#4a5568', fontWeight: 500 }}>
                  Clic para seleccionar el comprobante de pago
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Solo archivos PDF
                </div>
              </div>
            </Upload>
          )}
        </div>
      </Modal>
    </>
  );
};

export default OposicionCard;
