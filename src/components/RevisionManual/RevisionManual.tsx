import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Button, Modal, Upload, Form, Input, Radio,
  Table, Tag, Space, Spin, Typography, DatePicker, Select
} from 'antd';
import {
  UploadOutlined, FileAddOutlined, FolderOpenOutlined,
  LinkOutlined, FileTextOutlined, DeleteOutlined,
  SwapOutlined, WarningOutlined, CalendarOutlined,
  SearchOutlined, FilterOutlined, UserOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { notify } from '@/utils/notify';
import { recursosService } from '../../services/recursosService';
import { useAuth } from '../../context/AuthContext';
import { OposicionDetailModal } from '../Oposiciones/OposicionDetailModal';
import { Oposicion } from '@/types';
import api from '../../config/api';
import './RevisionManual.css';

const { Text } = Typography;

interface RevisionManualItem {
  temario_id: number;
  oposicion_id: number;
  oposicion_nombre: string;
  fecha_primera_solicitud: string;
  profesor_asignado_id?: number | null;
  profesor_asignado_nombre?: string | null;
  linea?: string | null;
  // Detalle de la oposición (enriquecido desde n8n para el modal de detalle)
  estado?: string;
  provincia?: string;
  nombre_municipio?: string;
  categoria?: string;
  num_plazas?: number;
  fecha_convocatoria?: string;
  fecha_fin?: string;
  url_bases_oficiales?: string;
  url_convocatoria?: string;
  observaciones?: string;
}

// Convierte el item de revisión al shape que espera el modal de detalle (igual que en Oposiciones)
const toOposicion = (i: RevisionManualItem): Oposicion => ({
  id: String(i.oposicion_id),
  titulo: i.oposicion_nombre,
  descripcion: i.observaciones || '',
  categoria: i.categoria || '',
  provincia: i.provincia || '',
  fechaConvocatoria: i.fecha_convocatoria || '',
  fechaFinalizacion: i.fecha_fin,
  plazas: i.num_plazas ?? 0,
  estado: i.estado === 'Abierta' ? 'abierta' : i.estado === 'Cerrada' ? 'cerrada' : 'en curso',
  urlBasesOficiales: i.url_bases_oficiales,
  urlConvocatoria: i.url_convocatoria,
  nombre_municipio: i.nombre_municipio,
  tieneTemarioListo: false,
});

const formatFecha = (fecha: string) => {
  const [year, month, day] = fecha.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${parseInt(day)} ${meses[parseInt(month) - 1]} ${year}`;
};

const RevisionManual: React.FC = () => {
  const { user, isProfesor, isAdmin } = useAuth();
  const [items, setItems] = useState<RevisionManualItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filtroProfesor, setFiltroProfesor] = useState<number | 'none' | null>(null);
  const [filtroLinea, setFiltroLinea] = useState<string | null>(null);

  // Subir temario modal
  const [subirTemarioModal, setSubirTemarioModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RevisionManualItem | null>(null);
  const [subirFile, setSubirFile] = useState<UploadFile[]>([]);
  const [subirLoading, setSubirLoading] = useState(false);

  // Ver recursos modal
  const [recursoViewModal, setRecursoViewModal] = useState(false);
  const [recursoViewList, setRecursoViewList] = useState<any[]>([]);
  const [recursoViewLoading, setRecursoViewLoading] = useState(false);

  // Agregar recurso modal
  const [addRecursoModal, setAddRecursoModal] = useState(false);
  const [recursoType, setRecursoType] = useState<'file' | 'url' | 'relacion'>('file');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadingRecurso, setUploadingRecurso] = useState(false);
  const [recursoForm] = Form.useForm();

  // Advertencia relación de temario
  const [relacionWarningVisible, setRelacionWarningVisible] = useState(false);

  // Detalle de la oposición (modal igual al de Oposiciones)
  const [detalleItem, setDetalleItem] = useState<RevisionManualItem | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await api.get<RevisionManualItem[]>('/lista-revisiones');
        const sorted = [...response.data].sort((a, b) =>
          new Date(b.fecha_primera_solicitud).getTime() - new Date(a.fecha_primera_solicitud).getTime()
        );
        setItems(sorted);
      } catch {
        notify.error('Error al cargar las revisiones manuales');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const openSubirTemario = (item: RevisionManualItem) => {
    setSelectedItem(item);
    setSubirFile([]);
    setSubirTemarioModal(true);
  };

  const handleSubirTemario = async () => {
    if (!selectedItem || subirFile.length === 0) {
      notify.warning('Seleccioná un archivo PDF');
      return;
    }
    const file = subirFile[0].originFileObj as File;
    if (file.type !== 'application/pdf') {
      notify.error('Solo se aceptan archivos PDF');
      return;
    }
    setSubirLoading(true);
    try {
      await recursosService.uploadRelacionTemario(
        selectedItem.oposicion_id,
        file,
        isProfesor ? user?.profesor_id : undefined
      );
      notify.success('Temario subido correctamente');
      setSubirTemarioModal(false);
      setSubirFile([]);
    } catch {
      notify.error('Error al subir el temario');
    } finally {
      setSubirLoading(false);
    }
  };

  const openRecursoView = async (item: RevisionManualItem) => {
    setSelectedItem(item);
    setRecursoViewModal(true);
    setRecursoViewLoading(true);
    try {
      const data = await recursosService.getRecursosByOposicion(item.oposicion_id);
      setRecursoViewList(data);
    } catch {
      notify.error('Error al cargar los recursos');
    } finally {
      setRecursoViewLoading(false);
    }
  };

  const handleDeleteRecurso = (recurso: any) => {
    const titulo = (recurso.titulo ?? '').toLowerCase();
    const esRelacion = titulo.includes('relaci') && titulo.includes('temario');
    if (esRelacion) {
      setRelacionWarningVisible(true);
      return;
    }
    Modal.confirm({
      title: '¿Eliminar recurso?',
      content: `Se eliminará "${recurso.titulo}". Esta acción no se puede deshacer.`,
      okText: 'Eliminar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await recursosService.deleteRecurso(recurso.id);
          setRecursoViewList(prev => prev.filter(r => r.id !== recurso.id));
          notify.success('Recurso eliminado correctamente');
        } catch {
          notify.error('Error al eliminar el recurso');
        }
      },
    });
  };

  const handleIrAReemplazar = () => {
    setRelacionWarningVisible(false);
    setRecursoViewModal(false);
    if (selectedItem) {
      setRecursoType('relacion');
      setFileList([]);
      recursoForm.resetFields();
      setAddRecursoModal(true);
    }
  };

  const openAddRecurso = () => {
    setRecursoType('file');
    setFileList([]);
    recursoForm.resetFields();
    setAddRecursoModal(true);
  };

  const handleAddRecurso = async (values: any) => {
    if (!selectedItem) return;
    setUploadingRecurso(true);
    try {
      if (recursoType === 'relacion') {
        if (fileList.length === 0) {
          notify.error('Por favor seleccioná un archivo PDF');
          setUploadingRecurso(false);
          return;
        }
        const file = fileList[0].originFileObj as File;
        if (file.type !== 'application/pdf') {
          notify.error('Solo se aceptan archivos PDF');
          setUploadingRecurso(false);
          return;
        }
        await recursosService.uploadRelacionTemario(
          selectedItem.oposicion_id,
          file,
          isProfesor ? user?.profesor_id : undefined
        );
        notify.success('Relación de temario cargada correctamente');
      } else {
        const formData = new FormData();
        formData.append('oposicion_id', selectedItem.oposicion_id.toString());
        formData.append('titulo', values.titulo);
        if (recursoType === 'file') {
          if (fileList.length === 0) {
            notify.error('Por favor seleccioná un archivo');
            setUploadingRecurso(false);
            return;
          }
          formData.append('data', fileList[0].originFileObj as File);
        } else {
          formData.append('url', values.url);
        }
        await recursosService.uploadRecurso(formData);
        notify.success('Recurso agregado correctamente');
      }
      setAddRecursoModal(false);
      recursoForm.resetFields();
      setFileList([]);
      const data = await recursosService.getRecursosByOposicion(selectedItem.oposicion_id);
      setRecursoViewList(data);
    } catch {
      notify.error('Error al agregar el recurso');
    } finally {
      setUploadingRecurso(false);
    }
  };

  // Opciones del filtro: profesores que aparecen asignados en los temarios cargados
  const profesoresOptions = useMemo(() => {
    const map = new Map<number, string>();
    items.forEach(i => {
      if (i.profesor_asignado_id != null) {
        map.set(i.profesor_asignado_id, i.profesor_asignado_nombre || `Profesor ${i.profesor_asignado_id}`);
      }
    });
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [items]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <motion.div
      className="revision-manual-container"
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
          Revisión Manual
        </motion.h1>
        <motion.p
          className="page-subtitle"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          Gestioná los temarios pendientes de revisión manual
        </motion.p>
      </div>

      <div className="rm-toolbar">
        <Input
          placeholder="Buscar por oposición..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          className="rm-search"
        />
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
          format="DD/MM/YYYY"
          placeholder={['Fecha desde', 'Fecha hasta']}
          allowClear
          className="rm-date-picker"
          suffixIcon={<FilterOutlined />}
        />
        {isAdmin && (
          <Select
            allowClear
            placeholder="Profesor asignado"
            value={filtroProfesor ?? undefined}
            onChange={(value) => setFiltroProfesor((value as number | 'none') ?? null)}
            options={[{ value: 'none', label: 'Sin asignar' }, ...profesoresOptions]}
            style={{ minWidth: 220 }}
            className="rm-profesor-select"
            suffixIcon={<UserOutlined />}
          />
        )}
        <Select
          allowClear
          placeholder="Línea"
          value={filtroLinea ?? undefined}
          onChange={(value) => setFiltroLinea((value as string) ?? null)}
          options={[
            { value: 'Supera', label: 'Supera' },
            { value: 'Patrio', label: 'Patrio' },
            { value: 'Otro', label: 'Otro' },
          ]}
          style={{ minWidth: 160 }}
          className="rm-linea-select"
        />
        {(searchText || dateRange || filtroProfesor != null || filtroLinea) && (
          <Button
            size="small"
            onClick={() => { setSearchText(''); setDateRange(null); setFiltroProfesor(null); setFiltroLinea(null); }}
            className="rm-clear-btn"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {(() => {
        const filtered = items.filter(i => {
          const matchesText = i.oposicion_nombre.toLowerCase().includes(searchText.toLowerCase());
          if (!matchesText) return false;
          if (filtroProfesor != null) {
            if (filtroProfesor === 'none') {
              if (i.profesor_asignado_id != null) return false;
            } else if (i.profesor_asignado_id !== filtroProfesor) {
              return false;
            }
          }
          if (filtroLinea && i.linea !== filtroLinea) return false;
          if (dateRange && dateRange[0] && dateRange[1]) {
            const fechaTs = new Date(i.fecha_primera_solicitud).setHours(0, 0, 0, 0);
            const fromTs = dateRange[0].startOf('day').valueOf();
            const toTs = dateRange[1].endOf('day').valueOf();
            return fechaTs >= fromTs && fechaTs <= toTs;
          }
          return true;
        });
        const hasFilters = searchText || dateRange || filtroProfesor != null || filtroLinea;
        return filtered.length === 0 ? (
          <div className="rm-empty">
            {hasFilters ? 'Sin resultados para los filtros aplicados.' : 'No hay revisiones manuales pendientes.'}
          </div>
        ) : (
          <div className="rm-cards-grid">
            {filtered.map((item, index) => (
              <motion.div
                key={item.temario_id}
                className="rm-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                onClick={() => setDetalleItem(item)}
                style={{ cursor: 'pointer' }}
                title="Ver detalle de la oposición"
              >
                <div className="rm-card-content">
                  <h3 className="rm-card-title">{item.oposicion_nombre}</h3>
                  <div className="rm-card-meta">
                    <span className="rm-card-id">ID Temario: {item.temario_id}</span>
                    {item.fecha_convocatoria && (
                      <span className="rm-card-fecha">
                        <CalendarOutlined /> Inicio convocatoria: {formatFecha(String(item.fecha_convocatoria).slice(0, 10))}
                      </span>
                    )}
                    {isAdmin && (
                      <span className="rm-card-profesor">
                        <UserOutlined />{' '}
                        {item.profesor_asignado_nombre
                          ? item.profesor_asignado_nombre
                          : <Tag color="default" style={{ margin: 0 }}>Sin asignar</Tag>}
                      </span>
                    )}
                  </div>
                </div>
              <div className="rm-card-actions" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => openSubirTemario(item)}
                  className="btn-subir-temario"
                >
                  Subir Temario
                </Button>
                <Button
                  icon={<FolderOpenOutlined />}
                  onClick={() => openRecursoView(item)}
                  className="btn-agregar-recursos"
                >
                  Agregar Recursos
                </Button>
              </div>
            </motion.div>
          ))}
          </div>
        );
      })()}

      {/* Modal Subir Temario */}
      <Modal
        title={`Subir Temario — ${selectedItem?.oposicion_nombre}`}
        open={subirTemarioModal}
        onCancel={() => { setSubirTemarioModal(false); setSubirFile([]); }}
        footer={null}
        className="rm-modal"
      >
        <div className="modal-content">
          <p style={{ color: '#64748b', marginBottom: 16 }}>
            Seleccioná el archivo PDF de la relación de temario.
          </p>
          <Upload
            beforeUpload={() => false}
            fileList={subirFile}
            onChange={({ fileList }) => setSubirFile(fileList)}
            accept=".pdf"
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Seleccionar PDF</Button>
          </Upload>
          <div className="modal-actions">
            <Button onClick={() => { setSubirTemarioModal(false); setSubirFile([]); }}>
              Cancelar
            </Button>
            <Button type="primary" onClick={handleSubirTemario} loading={subirLoading}>
              Subir Temario
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver/Agregar Recursos */}
      <Modal
        title={`Recursos — ${selectedItem?.oposicion_nombre}`}
        open={recursoViewModal}
        onCancel={() => { setRecursoViewModal(false); setRecursoViewList([]); }}
        footer={
          <Button type="primary" icon={<FileAddOutlined />} onClick={openAddRecurso}>
            Agregar Recurso
          </Button>
        }
        width={700}
        className="rm-modal"
      >
        {recursoViewLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : recursoViewList.length === 0 ? (
          <Text style={{ color: '#64748b' }}>No hay recursos para esta oposición.</Text>
        ) : (
          <Table
            dataSource={recursoViewList}
            rowKey={(r) => String(r.id ?? r.titulo)}
            pagination={false}
            size="small"
            columns={[
              { title: 'Título', dataIndex: 'titulo', key: 'titulo', ellipsis: true },
              {
                title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 100,
                render: (tipo) => <Tag>{tipo}</Tag>
              },
              {
                title: 'Enlace', dataIndex: 'url', key: 'url', width: 90,
                render: (url) => url
                  ? <Button type="link" icon={<LinkOutlined />} href={url} target="_blank" size="small">Abrir</Button>
                  : '—'
              },
              {
                title: '', key: 'delete', width: 48,
                render: (_, recurso) => {
                  const titulo = (recurso.titulo ?? '').toLowerCase();
                  const esRelacion = titulo.includes('relaci') && titulo.includes('temario');
                  return esRelacion ? (
                    <Button
                      type="text" size="small"
                      icon={<SwapOutlined style={{ color: '#d97706' }} />}
                      onClick={() => handleDeleteRecurso(recurso)}
                    />
                  ) : (
                    <Button
                      type="text" danger size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteRecurso(recurso)}
                    />
                  );
                }
              }
            ]}
          />
        )}
      </Modal>

      {/* Modal Agregar Recurso */}
      <Modal
        title="Agregar Recurso"
        open={addRecursoModal}
        onCancel={() => { setAddRecursoModal(false); recursoForm.resetFields(); setFileList([]); }}
        footer={null}
        width={600}
        className="rm-modal"
      >
        <Form form={recursoForm} layout="vertical" onFinish={handleAddRecurso}>
          {recursoType !== 'relacion' && (
            <Form.Item
              name="titulo"
              label="Título del Recurso"
              rules={[{ required: true, message: 'Ingresá el título del recurso' }]}
            >
              <Input placeholder="Ej: Temario oficial 2024" />
            </Form.Item>
          )}
          <Form.Item label="Tipo de Recurso">
            <Radio.Group
              value={recursoType}
              onChange={(e) => {
                setRecursoType(e.target.value);
                setFileList([]);
                recursoForm.setFieldsValue({ url: undefined, titulo: undefined });
              }}
            >
              <Radio.Button value="file"><UploadOutlined /> Subir Archivo</Radio.Button>
              <Radio.Button value="url"><LinkOutlined /> Enlace URL</Radio.Button>
              <Radio.Button value="relacion"><FileTextOutlined /> Relación de Temario</Radio.Button>
            </Radio.Group>
          </Form.Item>
          {recursoType === 'relacion' || recursoType === 'file' ? (
            <Form.Item label="Archivo">
              <Upload
                beforeUpload={() => false}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                accept={recursoType === 'relacion' ? '.pdf' : undefined}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>
                  Seleccionar {recursoType === 'relacion' ? 'PDF' : 'Archivo'}
                </Button>
              </Upload>
            </Form.Item>
          ) : (
            <Form.Item
              name="url"
              label="URL del Recurso"
              rules={[
                { required: true, message: 'Ingresá la URL' },
                { type: 'url', message: 'Ingresá una URL válida' }
              ]}
            >
              <Input placeholder="https://ejemplo.com/recurso.pdf" />
            </Form.Item>
          )}
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => { setAddRecursoModal(false); recursoForm.resetFields(); setFileList([]); }}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={uploadingRecurso}>
                {recursoType === 'relacion' ? 'Cargar la relación de temario' : 'Agregar Recurso'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal advertencia relación de temario */}
      <Modal
        open={relacionWarningVisible}
        onCancel={() => setRelacionWarningVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setRelacionWarningVisible(false)}>
            Cancelar
          </Button>,
          <Button
            key="replace"
            type="primary"
            icon={<SwapOutlined />}
            onClick={handleIrAReemplazar}
            style={{ background: '#1E3A5F', borderColor: '#1E3A5F' }}
          >
            Ir a reemplazar archivo
          </Button>,
        ]}
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d97706' }}>
            <WarningOutlined /> No se puede eliminar este recurso
          </span>
        }
      >
        <p>La relación de temario no se puede eliminar directamente. Podés reemplazarla subiendo un nuevo archivo PDF.</p>
      </Modal>

      {/* Modal Detalle de la Oposición (igual que en Oposiciones) */}
      <OposicionDetailModal
        isOpen={!!detalleItem}
        onClose={() => setDetalleItem(null)}
        oposicion={detalleItem ? toOposicion(detalleItem) : null}
      />
    </motion.div>
  );
};

export default RevisionManual;
