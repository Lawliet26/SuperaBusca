import { AnimatePresence, motion } from 'framer-motion';
import { Modal, Tag, Divider, Spin, Empty, message } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  BookOutlined,
  LinkOutlined
} from '@ant-design/icons';
import {
  X,
  FileText,
  Image,
  Video,
  Headphones,
  ExternalLink,
  Download
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Oposicion } from '@/types';
import { recursosService } from '@/services/recursosService';
import { RecursoGet } from '@/types';
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
  const [recursos, setRecursos] = useState<RecursoGet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && oposicion?.id) {
      fetchRecursos();
    }
  }, [isOpen, oposicion]);

  const fetchRecursos = async () => {
    if (!oposicion?.id) return;

    setLoading(true);
    try {
      const data = await recursosService.getRecursosByOposicion(Number(oposicion.id));
      setRecursos(data);
    } catch (error) {
      console.error('Error al cargar recursos:', error);
      message.error('Error al cargar los recursos');
    } finally {
      setLoading(false);
    }
  };

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

  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case 'documento':
        return <FileText className="recurso-icon" />;
      case 'image':
        return <Image className="recurso-icon" />;
      case 'video':
        return <Video className="recurso-icon" />;
      case 'audio':
        return <Headphones className="recurso-icon" />;
      case 'link':
        return <ExternalLink className="recurso-icon" />;
      default:
        return <FileText className="recurso-icon" />;
    }
  };

  const getColorByType = (tipo: string) => {
    switch (tipo) {
      case 'documento':
        return 'recurso-card-documento';
      case 'image':
        return 'recurso-card-imagen';
      case 'video':
        return 'recurso-card-video';
      case 'audio':
        return 'recurso-card-audio';
      case 'link':
        return 'recurso-card-link';
      default:
        return 'recurso-card-default';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'documento':
        return 'Documento';
      case 'image':
        return 'Imagen';
      case 'video':
        return 'Video';
      case 'audio':
        return 'Audio';
      case 'link':
        return 'Enlace';
      default:
        return 'Recurso';
    }
  };

  const handleRecursoClick = (recurso: RecursoGet) => {
    window.open(recurso.url, '_blank', 'noopener,noreferrer');
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
      <div >
        {/* Header */}
        <div className="detail-modal-header">
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
                  <span className="info-label">Url de bases oficiables</span>
                  <span className="info-value">Información de oposición</span>
                </div>
              </div>
            </a>
          </div>
        </div>

        <Divider />

        {/* Recursos */}
        <div className="detail-recursos-section">
          <h3 className="section-title">
            <FileText style={{ marginRight: 8 }} />
            Recursos Disponibles ({recursos.length})
          </h3>

          {loading ? (
            <div className="loading-container">
              <Spin size="large" tip="Cargando recursos..." />
            </div>
          ) : recursos.length > 0 ? (
            <div className="recursos-grid-detail">
              <AnimatePresence>
                {recursos.map((recurso, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`recurso-card ${getColorByType(recurso.tipo)}`}
                    onClick={() => handleRecursoClick(recurso)}
                  >
                    <div className="recurso-icon-container">
                      {getIconByType(recurso.tipo)}
                    </div>

                    <div className="recurso-content">
                      <h4 className="recurso-titulo">{recurso.titulo}</h4>
                      <span className="recurso-tipo-badge">
                        {getTipoLabel(recurso.tipo)}
                      </span>
                    </div>

                    <div className="recurso-action">
                      <Download className="recurso-action-icon" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Empty
              description="No hay recursos disponibles para esta oposición"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};