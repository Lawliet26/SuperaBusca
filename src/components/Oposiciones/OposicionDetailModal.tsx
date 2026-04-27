import { Modal, Tag, Divider } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  BookOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { X } from 'lucide-react';
import { Oposicion } from '@/types';
import './OposicionDetailModal.css';

interface OposicionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  oposicion: Oposicion | null;
}

export const OposicionDetailModal = ({
  isOpen,
  onClose,
  oposicion
}: OposicionDetailModalProps) => {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'abierta':
        return 'success';
      case 'cerrada':
        return 'error';
      case 'en curso':
        return 'warning';
      default:
        return 'default';
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

  if (!oposicion) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      className="oposicion-detail-modal"
      closeIcon={<X />}
    >
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div className="detail-modal-header" style={{ padding: 0 }}>
          <div className="header-tags">
            <Tag color={getEstadoColor(oposicion.estado)}>
              {getEstadoLabel(oposicion.estado)}
            </Tag>
            <Tag color="blue">{oposicion.categoria}</Tag>
          </div>
          <h2 className="detail-modal-title">{oposicion.titulo}</h2>
          {oposicion.descripcion && oposicion.descripcion !== "null" && (
            <p className="detail-modal-description">{oposicion.descripcion}</p>
          )}
        </div>

        <Divider />

        {/* Información General */}
        <div className="detail-info-section">
          <h3 className="section-title">
            <BookOutlined style={{ marginRight: 8 }} />
            Información General
          </h3>
          <div className="info-grid">
            <div className="info-item-detail">
              <EnvironmentOutlined className="info-icon" />
              <div>
                <span className="info-label">Provincia</span>
                <span className="info-value">{oposicion.provincia}</span>
              </div>
            </div>
            <div className="info-item-detail">
              <EnvironmentOutlined className="info-icon" />
              <div>
                <span className="info-label">Municipio</span>
                <span className="info-value">{oposicion.nombre_municipio}</span>
              </div>
            </div>
            <div className="info-item-detail">
              <CalendarOutlined className="info-icon" />
              <div>
                <span className="info-label">Fecha de Convocatoria</span>
                <span className="info-value">
                  {new Date(oposicion.fechaConvocatoria).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
            {oposicion.fechaFinalizacion && (
              <div className="info-item-detail">
                <CalendarOutlined className="info-icon" />
                <div>
                  <span className="info-label">Fecha de Finalización</span>
                  <span className="info-value">
                    {new Date(oposicion.fechaFinalizacion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}
            <div className="info-item-detail">
              <TeamOutlined className="info-icon" />
              <div>
                <span className="info-label">Plazas Disponibles</span>
                <span className="info-value">{oposicion.plazas} plazas</span>
              </div>
            </div>
            <a className="info-value" href={oposicion.urlBasesOficiales} target="_blank" rel="noopener noreferrer">
              <div className="info-item-detail">
                <LinkOutlined className="info-icon" />
                <div>
                  <span className="info-label">Oficiales</span>
                  <span className="info-value">Información de oposición</span>
                </div>
              </div>
            </a>
            {oposicion.urlConvocatoria && (
              <a className="info-value" href={oposicion.urlConvocatoria} target="_blank" rel="noopener noreferrer">
                <div className="info-item-detail">
                  <LinkOutlined className="info-icon" />
                  <div>
                    <span className="info-label">Convocatoria</span>
                    <span className="info-value">Ver convocatoria</span>
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>

      </div>
    </Modal>
  );
};