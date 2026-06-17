import { useEffect, useState } from 'react';
import { Modal, Tag, Divider, Spin } from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  BookOutlined,
  LinkOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { X } from 'lucide-react';
import dayjs from 'dayjs';
import { Oposicion } from '@/types';
import { actividadesService, Actividad } from '@/services/actividadesService';
import './OposicionDetailModal.css';

const TIPO_ACT: Record<string, { label: string; color: string }> = {
  reunion: { label: 'Reunión', color: 'blue' },
  actividad: { label: 'Actividad', color: 'green' },
  fecha_especial: { label: 'Fecha especial', color: 'gold' },
  otro: { label: 'Otro', color: 'default' },
};

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
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loadingAct, setLoadingAct] = useState(false);

  useEffect(() => {
    if (!isOpen || !oposicion) return;
    let cancel = false;
    setLoadingAct(true);
    actividadesService.list({ oposicion_id: Number(oposicion.id) })
      .then((data) => { if (!cancel) setActividades(data); })
      .catch(() => { if (!cancel) setActividades([]); })
      .finally(() => { if (!cancel) setLoadingAct(false); });
    return () => { cancel = true; };
  }, [isOpen, oposicion?.id]);

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

        {(loadingAct || actividades.length > 0) && (
          <>
            <Divider />
            <div className="detail-info-section">
              <h3 className="section-title">
                <CalendarOutlined style={{ marginRight: 8 }} />
                Actividades
              </h3>
              {loadingAct ? (
                <div style={{ textAlign: 'center', padding: 16 }}><Spin /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {actividades.map((a) => {
                    const info = TIPO_ACT[a.tipo || ''] || { label: a.tipo, color: 'default' };
                    return (
                      <div
                        key={a.id}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderLeft: `4px solid ${a.color || '#23C27B'}`,
                          borderRadius: 10,
                          padding: '12px 14px',
                          background: '#fff',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          {a.tipo && <Tag color={info.color}>{info.label}</Tag>}
                          <span style={{ fontWeight: 700, color: '#1a2332' }}>{a.titulo || 'Actividad'}</span>
                        </div>
                        {a.descripcion && (
                          <p style={{ color: '#4a5568', fontSize: 13, margin: '0 0 8px' }}>{a.descripcion}</p>
                        )}
                        {a.fecha_inicio && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 12 }}>
                            <ClockCircleOutlined />
                            <span>
                              {dayjs(a.fecha_inicio).format(a.todo_el_dia ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm')}
                              {a.fecha_fin ? ` — ${dayjs(a.fecha_fin).format(a.todo_el_dia ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm')}` : ''}
                            </span>
                          </div>
                        )}
                        {a.ubicacion && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 12, marginTop: 4 }}>
                            <EnvironmentOutlined />
                            <span>{a.ubicacion}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </Modal>
  );
};