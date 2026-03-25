import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapse, Button, Modal, Input, message, Tag, Space, Spin, Popconfirm } from 'antd';
import {
  CheckCircleOutlined,
  EditOutlined,
  UserOutlined,
  LinkOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { revisionesService } from '../../services/revisionesService';
import { mapeosDetalleService, MapeoDetalle } from '../../services/mapeosDetalleService';
import { useAuth } from '../../context/AuthContext';
import './Revisiones.css';

const { Panel } = Collapse;
const { TextArea } = Input;

const Revisiones: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [revisiones, setRevisiones] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<string | null>(null);
  const [correccionText, setCorreccionText] = useState('');

  // Estado edición/eliminación de recursos vinculados
  const [recursoEditVisible, setRecursoEditVisible] = useState(false);
  const [recursoEditContext, setRecursoEditContext] = useState<{ revisionId: string; temaIndex: number; recursoId: number } | null>(null);
  const [recursoEditForm, setRecursoEditForm] = useState({ tema_convocatoria_titulo: '', notas: '' });
  const [recursoEditLoading, setRecursoEditLoading] = useState(false);

  // Estado CRUD mapeos
  const [mapeosMap, setMapeosMap] = useState<Record<string, MapeoDetalle[]>>({});
  const [mapeoModalVisible, setMapeoModalVisible] = useState(false);
  const [mapeoModalMode, setMapeoModalMode] = useState<'create' | 'edit'>('create');
  const [mapeoContext, setMapeoContext] = useState<{ revisionId: string; temarioId: number; temaIndex: number } | null>(null);
  const [editingMapeoId, setEditingMapeoId] = useState<number | null>(null);
  const [mapeoForm, setMapeoForm] = useState({ tema_convocatoria_titulo: '', notas: '' });
  const [mapeoLoading, setMapeoLoading] = useState(false);

  useEffect(() => {
    const fetchRevisiones = async () => {
      try {
        setLoading(true);
        const data = await revisionesService.getRevisiones();
        setRevisiones(data);
      } catch (error) {
        message.error('Error al cargar las revisiones');
      } finally {
        setLoading(false);
      }
    };
    fetchRevisiones();
  }, []);

  const handleAprobar = async (id: string) => {
    setActionLoading(true);
    try {
      await revisionesService.aprobar(
        isAdmin ? null : parseInt(user?.profesor_id || '0'),
        parseInt(id),
        '',
        user?.rol || 'PROFESOR',
        isAdmin ? parseInt(user?.id || '0') : null
      );
      setRevisiones(prev =>
        prev.map(r => r.id === id ? { ...r, estado: 'aprobado' as const } : r)
      );
      message.success('Revisión aprobada correctamente');
    } catch (error) {
      message.error('Error al aprobar la revisión');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCorreccion = (id: string) => {
    setSelectedRevision(id);
    setCorreccionText('');
    setModalVisible(true);
  };

  const handleSolicitarCorreccion = async () => {
    if (!correccionText.trim()) {
      message.warning('Debes escribir la corrección requerida');
      return;
    }
    setActionLoading(true);
    try {
      await revisionesService.solicitarCorreccion(
        isAdmin ? null : parseInt(user?.profesor_id || '0'),
        parseInt(selectedRevision || '0'),
        correccionText,
        user?.rol || 'PROFESOR',
        isAdmin ? parseInt(user?.id || '0') : null
      );
      setRevisiones(prev =>
        prev.map(r => r.id === selectedRevision ? { ...r, estado: 'corregir' as const } : r)
      );
      message.success('Corrección solicitada correctamente');
      setModalVisible(false);
      setCorreccionText('');
      setSelectedRevision(null);
    } catch (error) {
      message.error('Error al solicitar la corrección');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Edición/eliminación de recursos vinculados ---
  const openRecursoEdit = (recurso: any, revisionId: string, temaIndex: number, temaTitulo: string) => {
    setRecursoEditContext({ revisionId, temaIndex, recursoId: recurso.id });
    setRecursoEditForm({ tema_convocatoria_titulo: temaTitulo, notas: recurso.notas || '' });
    setRecursoEditVisible(true);
  };

  const handleSaveRecurso = async () => {
    if (!recursoEditContext) return;
    setRecursoEditLoading(true);
    try {
      await mapeosDetalleService.update({ id: recursoEditContext.recursoId, ...recursoEditForm });
      setRevisiones(prev => prev.map(r => {
        if (r.id !== recursoEditContext.revisionId) return r;
        return {
          ...r,
          temas: r.temas.map((t: any, ti: number) => {
            if (ti !== recursoEditContext.temaIndex) return t;
            return {
              ...t,
              recursos_vinculados: t.recursos_vinculados.map((rv: any) =>
                rv.id === recursoEditContext.recursoId
                  ? { ...rv, tema_convocatoria_titulo: recursoEditForm.tema_convocatoria_titulo }
                  : rv
              )
            };
          })
        };
      }));
      message.success('Recurso actualizado correctamente');
      setRecursoEditVisible(false);
    } catch {
      message.error('Error al actualizar el recurso');
    } finally {
      setRecursoEditLoading(false);
    }
  };

  const handleDeleteRecurso = async (recursoId: number, revisionId: string, temaIndex: number) => {
    try {
      await mapeosDetalleService.delete(recursoId);
      setRevisiones(prev => prev.map(r => {
        if (r.id !== revisionId) return r;
        return {
          ...r,
          temas: r.temas.map((t: any, ti: number) => {
            if (ti !== temaIndex) return t;
            return {
              ...t,
              recursos_vinculados: t.recursos_vinculados.filter((rv: any) => rv.id !== recursoId)
            };
          })
        };
      }));
      message.success('Recurso eliminado correctamente');
    } catch {
      message.error('Error al eliminar el recurso');
    }
  };

  // --- CRUD Mapeos ---
  const getMapeosKey = (revisionId: string, temaIndex: number) => `${revisionId}_${temaIndex}`;
  const getMapeos = (revisionId: string, temaIndex: number): MapeoDetalle[] =>
    mapeosMap[getMapeosKey(revisionId, temaIndex)] || [];

  const openMapeoModal = (
    mode: 'create' | 'edit',
    temaTitle: string,
    revisionId: string,
    temaIndex: number,
    mapeo?: MapeoDetalle
  ) => {
    setMapeoModalMode(mode);
    setMapeoContext({ revisionId, temarioId: parseInt(revisionId), temaIndex });
    setEditingMapeoId(mapeo?.id ?? null);
    setMapeoForm({
      tema_convocatoria_titulo: mapeo?.tema_convocatoria_titulo ?? temaTitle,
      notas: mapeo?.notas ?? ''
    });
    setMapeoModalVisible(true);
  };

  const handleSaveMapeo = async () => {
    if (!mapeoForm.tema_convocatoria_titulo.trim()) {
      message.warning('El título de convocatoria es requerido');
      return;
    }
    if (!mapeoContext) return;
    setMapeoLoading(true);
    const key = getMapeosKey(mapeoContext.revisionId, mapeoContext.temaIndex);
    try {
      if (mapeoModalMode === 'create') {
        const newMapeo = await mapeosDetalleService.create({ ...mapeoForm, temario_id: mapeoContext.temarioId });
        setMapeosMap(prev => ({ ...prev, [key]: [...(prev[key] || []), newMapeo] }));
        message.success('Mapeo creado correctamente');
      } else {
        const updated = await mapeosDetalleService.update({ id: editingMapeoId!, ...mapeoForm });
        setMapeosMap(prev => ({
          ...prev,
          [key]: prev[key].map(m => m.id === editingMapeoId ? updated : m)
        }));
        message.success('Mapeo actualizado correctamente');
      }
      setMapeoModalVisible(false);
    } catch {
      message.error('Error al guardar el mapeo');
    } finally {
      setMapeoLoading(false);
    }
  };

  const handleDeleteMapeo = async (mapeoId: number, revisionId: string, temaIndex: number) => {
    const key = getMapeosKey(revisionId, temaIndex);
    try {
      await mapeosDetalleService.delete(mapeoId);
      setMapeosMap(prev => ({ ...prev, [key]: prev[key].filter(m => m.id !== mapeoId) }));
      message.success('Mapeo eliminado correctamente');
    } catch {
      message.error('Error al eliminar el mapeo');
    }
  };

  const getEstadoTag = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Tag color="blue">Pendiente</Tag>;
      case 'aprobado': return <Tag color="green">Aprobado</Tag>;
      case 'corregir': return <Tag color="orange">En Corrección</Tag>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Cargando revisiones..." />
      </div>
    );
  }

  return (
    <motion.div
      className="revisiones-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="page-header">
        <motion.h1
          className="page-title"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          Revisiones
        </motion.h1>
        <motion.p
          className="page-subtitle"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          Revisa y evalúa los temarios de las oposiciones
        </motion.p>
      </div>

      <AnimatePresence>
        <Collapse
          className="revisiones-collapse"
          accordion
          expandIconPosition="end"
        >
          {Array.isArray(revisiones) &&
            revisiones.length > 0 &&
            revisiones.some(c => Array.isArray(c.temas) && c.temas.length > 0) &&
            revisiones.map((revision, index) => (
            <Panel
              key={revision.id}
              header={
                <motion.div
                  className="revision-header"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="revision-header-content">
                    <h3 className="revision-title">{revision.titulo}</h3>
                    <div className="revision-meta">
                      <Space size="middle">
                        <span><UserOutlined /> {revision.candidato}</span>
                        {getEstadoTag(revision.estado)}
                      </Space>
                    </div>
                  </div>
                  <div className="revision-actions">
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleAprobar(revision.id)}
                      loading={actionLoading}
                      className="btn-aprobar"
                    >
                      Aprobar
                    </Button>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleOpenCorreccion(revision.id)}
                      className="btn-corregir"
                    >
                      Corregir
                    </Button>
                  </div>
                </motion.div>
              }
            >
              <div className="revision-content">
                {/* Mapeos manuales - sección única por revisión */}
                <div className="mapeos-manuales-section">
                  <div className="mapeos-manuales-header">
                    <span className="mapeos-manuales-title">Mapeos manuales</span>
                    <Button
                      className="btn-add-mapeo"
                      icon={<PlusOutlined />}
                      onClick={(e) => { e.stopPropagation(); openMapeoModal('create', '', revision.id, 0); }}
                    >
                      Añadir mapeo
                    </Button>
                  </div>
                  {getMapeos(revision.id, 0).map(mapeo => (
                    <div key={mapeo.id} className="mapeo-manual-item">
                      <div className="mapeo-manual-info">
                        {mapeo.tema_convocatoria_titulo && <Tag color="purple">{mapeo.tema_convocatoria_titulo}</Tag>}
                        {mapeo.notas && <span className="mapeo-backup">{mapeo.notas}</span>}
                      </div>
                      <Space>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => { e.stopPropagation(); openMapeoModal('edit', '', revision.id, 0, mapeo); }}
                        />
                        <Popconfirm
                          title="¿Eliminar este mapeo?"
                          onConfirm={() => handleDeleteMapeo(mapeo.id, revision.id, 0)}
                          okText="Sí"
                          cancelText="No"
                        >
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    </div>
                  ))}
                </div>

                {Array.isArray(revision.temas) && revision.temas.map((tema, tIndex) => (
                  <div key={tIndex} className="tema-section">
                    <h4>{tema.titulo}</h4>

                    {tema.recursos_vinculados?.map((recurso, rIndex) => (
                      <div key={rIndex} className="documento-item">
                        <div className="documento-item-header">
                          <Space size="middle" wrap>
                            {recurso.tema_academia_titulo_backup && recurso.tema_academia_titulo_backup !== 'Personalizado' && <Tag color="cyan">{recurso.tema_academia_titulo_backup}</Tag>}
                            {recurso.ley_detectada && <Tag color="blue">{recurso.ley_detectada}</Tag>}
                            {recurso.coincidencia_maxima && (
                              <Tag color="green">{parseFloat(recurso.coincidencia_maxima).toFixed(2)}%</Tag>
                            )}
                            {recurso.url_pdf_evidencia && (
                              <a
                                href={recurso.url_pdf_evidencia}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="documento-link"
                              >
                                <LinkOutlined /> Ver PDF Evidencia
                              </a>
                            )}
                          </Space>
                          {recurso.id && (
                            <Space>
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => openRecursoEdit(recurso, revision.id, tIndex, tema.titulo)}
                              />
                              <Popconfirm
                                title="¿Eliminar este recurso?"
                                onConfirm={() => handleDeleteRecurso(recurso.id, revision.id, tIndex)}
                                okText="Sí"
                                cancelText="No"
                              >
                                <Button size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          )}
                        </div>
                        {recurso.fragmentos_notas?.length > 0 && (
                          <div className="notas-section">
                            <h4>Notas:</h4>
                            <ul>
                              {recurso.fragmentos_notas.map((n, i) => (
                                <li key={i}>{n.nota} ({n.coincidencia}%)</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </Collapse>
      </AnimatePresence>

      {/* Modal corrección */}
      <Modal
        title="Solicitar Corrección"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        className="correccion-modal"
      >
        <div className="modal-content">
          <p className="modal-description">Indica qué aspectos debe corregir:</p>
          <TextArea
            rows={4}
            placeholder="Escribe los aspectos a corregir..."
            value={correccionText}
            onChange={(e) => setCorreccionText(e.target.value)}
            className="correccion-textarea"
          />
          <div className="modal-actions">
            <Button onClick={() => setModalVisible(false)}>Cancelar</Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="primary"
                onClick={handleSolicitarCorreccion}
                loading={actionLoading}
                className="btn-solicitar"
              >
                Solicitar Corrección
              </Button>
            </motion.div>
          </div>
        </div>
      </Modal>

      {/* Modal edición recurso vinculado */}
      <Modal
        title="Editar recurso"
        open={recursoEditVisible}
        onCancel={() => setRecursoEditVisible(false)}
        footer={null}
      >
        <div className="modal-content">
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Título tema convocatoria</label>
            <Input
              value={recursoEditForm.tema_convocatoria_titulo}
              onChange={(e) => setRecursoEditForm(prev => ({ ...prev, tema_convocatoria_titulo: e.target.value }))}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Notas</label>
            <Input
              value={recursoEditForm.notas}
              onChange={(e) => setRecursoEditForm(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Notas del recurso"
            />
          </div>
          <div className="modal-actions">
            <Button onClick={() => setRecursoEditVisible(false)}>Cancelar</Button>
            <Button type="primary" onClick={handleSaveRecurso} loading={recursoEditLoading}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal mapeo manual */}
      <Modal
        title={mapeoModalMode === 'create' ? 'Añadir mapeo manual' : 'Editar mapeo'}
        open={mapeoModalVisible}
        onCancel={() => setMapeoModalVisible(false)}
        footer={null}
        className="mapeo-modal"
      >
        <div className="modal-content">
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Título tema convocatoria</label>
            <Input
              value={mapeoForm.tema_convocatoria_titulo}
              onChange={(e) => setMapeoForm(prev => ({ ...prev, tema_convocatoria_titulo: e.target.value }))}
              placeholder="Título del tema de convocatoria"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Notas</label>
            <Input
              value={mapeoForm.notas}
              onChange={(e) => setMapeoForm(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Notas del mapeo"
            />
          </div>
          <div className="modal-actions">
            <Button onClick={() => setMapeoModalVisible(false)}>Cancelar</Button>
            <Button type="primary" onClick={handleSaveMapeo} loading={mapeoLoading}>
              {mapeoModalMode === 'create' ? 'Crear mapeo' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default Revisiones;
