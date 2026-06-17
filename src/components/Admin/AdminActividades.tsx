import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, DatePicker, Switch, Modal, Form,
  Typography, Card, Spin, Popconfirm, Tooltip, ConfigProvider, theme
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, FilterOutlined,
  CalendarOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { notify } from '@/utils/notify';
import { actividadesService, Actividad, ActividadInput } from '../../services/actividadesService';
import { oposicionesService } from '../../services/oposicionesService';
import './AdminOposiciones.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const TIPOS = [
  { value: 'reunion', label: 'Reunión', color: 'blue' },
  { value: 'actividad', label: 'Actividad', color: 'green' },
  { value: 'fecha_especial', label: 'Fecha especial', color: 'gold' },
  { value: 'otro', label: 'Otro', color: 'default' },
];

const COLORES = [
  { value: '#23C27B', label: 'Verde' },
  { value: '#2A4F82', label: 'Azul' },
  { value: '#f59e0b', label: 'Naranja' },
  { value: '#ef4444', label: 'Rojo' },
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#94a3b8', label: 'Gris' },
];

const tipoInfo = (tipo: string | null) => TIPOS.find(t => t.value === tipo);

const AdminActividades: React.FC = () => {
  const [items, setItems] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Modal alta/edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Actividad | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Opciones de oposiciones para vincular (opcional)
  const [opoOptions, setOpoOptions] = useState<{ value: number; label: string }[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await actividadesService.list({
        tipo: filtroTipo || undefined,
        fecha_inicio: dateRange?.[0]?.startOf('day').toISOString(),
        fecha_fin: dateRange?.[1]?.endOf('day').toISOString(),
      });
      setItems(data);
    } catch {
      notify.error('Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [filtroTipo, dateRange]);

  // Cargamos un set de oposiciones para el selector opcional del modal
  useEffect(() => {
    (async () => {
      try {
        const res = await oposicionesService.getOposicionesAdmin({ limit: 100, offset: 0 });
        setOpoOptions((res.data || []).map((o: any) => ({ value: o.id, label: `${o.titulo} (#${o.id})` })));
      } catch {
        /* no bloqueante */
      }
    })();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ todo_el_dia: false });
    setModalOpen(true);
  };

  const openEdit = (a: Actividad) => {
    setEditing(a);
    form.setFieldsValue({
      titulo: a.titulo ?? undefined,
      tipo: a.tipo ?? undefined,
      descripcion: a.descripcion ?? undefined,
      fecha_inicio: a.fecha_inicio ? dayjs(a.fecha_inicio) : undefined,
      fecha_fin: a.fecha_fin ? dayjs(a.fecha_fin) : undefined,
      todo_el_dia: !!a.todo_el_dia,
      ubicacion: a.ubicacion ?? undefined,
      color: a.color ?? undefined,
      oposicion_id: a.oposicion_id ?? undefined,
    });
    // Si la actividad tiene una oposición que no está en las opciones cargadas, la agregamos
    if (a.oposicion_id && a.oposicion_nombre && !opoOptions.some(o => o.value === a.oposicion_id)) {
      setOpoOptions(prev => [{ value: a.oposicion_id as number, label: a.oposicion_nombre as string }, ...prev]);
    }
    setModalOpen(true);
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const payload: ActividadInput = {
        titulo: values.titulo?.trim() || null,
        descripcion: values.descripcion?.trim() || null,
        tipo: values.tipo || null,
        fecha_inicio: values.fecha_inicio ? values.fecha_inicio.toISOString() : null,
        fecha_fin: values.fecha_fin ? values.fecha_fin.toISOString() : null,
        todo_el_dia: !!values.todo_el_dia,
        ubicacion: values.ubicacion?.trim() || null,
        color: values.color || null,
        oposicion_id: values.oposicion_id ?? null,
      };
      if (editing) {
        await actividadesService.update(editing.id, payload);
        notify.success('Actividad actualizada');
      } else {
        await actividadesService.create(payload);
        notify.success('Actividad creada');
      }
      setModalOpen(false);
      loadData();
    } catch {
      notify.error('Error al guardar la actividad');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await actividadesService.remove(id);
      setItems(prev => prev.filter(a => a.id !== id));
      notify.success('Actividad eliminada');
    } catch {
      notify.error('Error al eliminar la actividad');
    }
  };

  const clearFilters = () => {
    setFiltroTipo(null);
    setDateRange(null);
  };
  const hasActiveFilters = !!(filtroTipo || dateRange);

  const fmt = (f: string | null, todoDia?: boolean | null) =>
    f ? dayjs(f).format(todoDia ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm') : '—';

  const columns: ColumnsType<Actividad> = [
    {
      title: 'Título',
      dataIndex: 'titulo',
      key: 'titulo',
      render: (v: string | null, row) => (
        <Space>
          {row.color && <span style={{ width: 10, height: 10, borderRadius: '50%', background: row.color, display: 'inline-block' }} />}
          <Text strong>{v?.trim() || <Text type="secondary">(sin título)</Text>}</Text>
        </Space>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 150,
      render: (t: string | null) => {
        const info = tipoInfo(t);
        return info ? <Tag color={info.color}>{info.label}</Tag> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Inicio',
      dataIndex: 'fecha_inicio',
      key: 'fecha_inicio',
      width: 170,
      render: (f: string | null, row) => f ? (
        <Space size={4}><CalendarOutlined style={{ color: '#23C27B' }} /><Text>{fmt(f, row.todo_el_dia)}</Text></Space>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Fin',
      dataIndex: 'fecha_fin',
      key: 'fecha_fin',
      width: 170,
      render: (f: string | null, row) => <Text>{fmt(f, row.todo_el_dia)}</Text>,
    },
    {
      title: 'Ubicación',
      dataIndex: 'ubicacion',
      key: 'ubicacion',
      ellipsis: true,
      render: (u: string | null) => u ? (
        <Space size={4}><EnvironmentOutlined style={{ color: '#23C27B' }} /><Text>{u}</Text></Space>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Oposición',
      dataIndex: 'oposicion_nombre',
      key: 'oposicion_nombre',
      ellipsis: true,
      render: (o: string | null, row) => o
        ? <Tag color="purple">{o} (#{row.oposicion_id})</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 110,
      render: (_, row) => (
        <Space>
          <Tooltip title="Editar">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar esta actividad?"
            onConfirm={() => handleDelete(row.id)}
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-historico">
      <div className="admin-header">
        <div className="header-content">
          <Title level={2} className="admin-title">Actividades</Title>
          <Text type="secondary" className="admin-subtitle">
            Reuniones, actividades del calendario y fechas especiales
          </Text>
        </div>
        <div className="header-stats">
          <Card size="small" className="stat-card">
            <Text type="secondary">Total</Text>
            <Title level={3}>{items.length}</Title>
          </Card>
        </div>
      </div>

      <Card className="filters-card">
        <div className="filters-header">
          <Space><FilterOutlined /><Text strong>Filtros</Text></Space>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nueva actividad
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>Recargar</Button>
            {hasActiveFilters && <Button onClick={clearFilters}>Limpiar filtros</Button>}
          </Space>
        </div>
        <div className="filters-content">
          <Select
            allowClear
            placeholder="Tipo"
            value={filtroTipo ?? undefined}
            onChange={(v) => setFiltroTipo(v ?? null)}
            options={TIPOS.map(t => ({ value: t.value, label: t.label }))}
            className="search-input"
          />
          <RangePicker
            placeholder={['Fecha desde', 'Fecha hasta']}
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
            format="DD/MM/YYYY"
            className="date-range-picker"
          />
        </div>
      </Card>

      <Card className="table-card">
        {loading ? (
          <div className="loading-container"><Spin size="large" tip="Cargando actividades..." /></div>
        ) : (
          <Table
            columns={columns}
            dataSource={items}
            rowKey="id"
            pagination={{ pageSize: 20, showTotal: (t, r) => <Text type="secondary">{r[0]}-{r[1]} de {t}</Text> }}
            size="middle"
            className="admin-table"
            locale={{ emptyText: 'No hay actividades. Creá la primera con "Nueva actividad".' }}
          />
        )}
      </Card>

      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: { colorBgContainer: '#ffffff', colorText: '#1a2332', colorTextSecondary: '#5a6678', colorBorder: '#d1d5db', colorPrimary: '#23C27B' },
        }}
      >
        <Modal
          title={editing ? 'Editar actividad' : 'Nueva actividad'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={() => form.submit()}
          okText={editing ? 'Guardar cambios' : 'Crear'}
          cancelText="Cancelar"
          confirmLoading={saving}
          width={560}
        >
          <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 8 }}>
            <Form.Item name="titulo" label="Título">
              <Input placeholder="Ej: Reunión de coordinación" maxLength={200} />
            </Form.Item>

            <Space style={{ display: 'flex' }} align="start">
              <Form.Item name="tipo" label="Tipo" style={{ flex: 1, minWidth: 200 }}>
                <Select allowClear placeholder="Tipo" options={TIPOS.map(t => ({ value: t.value, label: t.label }))} />
              </Form.Item>
              <Form.Item name="color" label="Color" style={{ width: 160 }}>
                <Select
                  allowClear
                  placeholder="Color"
                  options={COLORES.map(c => ({
                    value: c.value,
                    label: (
                      <Space size={6}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: c.value, display: 'inline-block' }} />
                        {c.label}
                      </Space>
                    ),
                  }))}
                />
              </Form.Item>
            </Space>

            <Form.Item name="descripcion" label="Descripción">
              <TextArea rows={3} placeholder="Detalle de la actividad" />
            </Form.Item>

            <Space style={{ display: 'flex' }} align="start">
              <Form.Item name="fecha_inicio" label="Inicio" style={{ flex: 1 }}>
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} placeholder="Inicio" />
              </Form.Item>
              <Form.Item name="fecha_fin" label="Fin" style={{ flex: 1 }}>
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} placeholder="Fin" />
              </Form.Item>
            </Space>

            <Form.Item name="todo_el_dia" label="Todo el día" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item name="ubicacion" label="Ubicación / Enlace">
              <Input placeholder="Lugar físico o link de la reunión" maxLength={255} />
            </Form.Item>

            <Form.Item
              name="oposicion_id"
              label="Oposición"
              rules={[{ required: true, message: 'Selecciona la oposición a la que pertenece la actividad' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Vincular a una oposición"
                options={opoOptions}
              />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default AdminActividades;
