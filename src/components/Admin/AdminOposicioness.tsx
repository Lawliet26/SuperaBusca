import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Table,
  Select,
  Input,
  Button,
  message,
  Space,
  Spin,
  Modal,
  Form,
  Tag,
  Divider,
  DatePicker,
  Card,
  Typography,
  Tooltip,
  Badge,
  InputNumber,
  Upload,
  Radio
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  FilterOutlined,
  LinkOutlined,
  CalendarOutlined,
  FileAddOutlined,
  UploadOutlined
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { InputRef } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { oposicionesService } from '../../services/oposicionesService';
import { provinciasService, Provincia } from '../../services/provinciasService';
import { municipiosService, Municipio } from '../../services/municipiosService';
import { categoriasService, Categoria } from '../../services/categoriasService';
import { recursosService } from '../../services/recursosService';
import { OposicionAdmin } from '../../types';
import './AdminOposiciones.css';
import { useAuth } from '@/context/AuthContext';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const TIPOS_OPOSICION = ['Convocatoria', 'Oferta'];
const ESTADOS_OPOSICION = ['Abierta', 'Cerrada', 'En curso'];

const AdminOposiciones: React.FC = () => {
  const { user } = useAuth();
  const [oposiciones, setOposiciones] = useState<OposicionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [editedRow, setEditedRow] = useState<Partial<OposicionAdmin>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterProvincia, setFilterProvincia] = useState<number | null>(null);
  const [filterMunicipio, setFilterMunicipio] = useState<number | null>(null);
  const [filterCategoria, setFilterCategoria] = useState<number | null>(null);
  const [filterEstado, setFilterEstado] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Add new item modals
  const [addProvinciaModal, setAddProvinciaModal] = useState(false);
  const [addMunicipioModal, setAddMunicipioModal] = useState(false);
  const [addCategoriaModal, setAddCategoriaModal] = useState(false);
  const [addOposicionModal, setAddOposicionModal] = useState(false);
  const [addRecursoModal, setAddRecursoModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // Create oposicion form
  const [createForm] = Form.useForm();
  const [creatingOposicion, setCreatingOposicion] = useState(false);

  // Recurso modal
  const [recursoForm] = Form.useForm();
  const [selectedOposicionId, setSelectedOposicionId] = useState<number | null>(null);
  const [uploadingRecurso, setUploadingRecurso] = useState(false);
  const [recursoType, setRecursoType] = useState<'file' | 'url'>('file');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, searchText, filterProvincia, filterMunicipio, filterCategoria, filterEstado, filterTipo, filterDateRange]);

  const loadCatalogs = async () => {
    try {
      const [provData, munData, catData] = await Promise.all([
        provinciasService.getProvincias(),
        municipiosService.getMunicipios(),
        categoriasService.getCategorias()
      ]);

      setProvincias(provData);
      setMunicipios(munData);
      setCategorias(catData);
    } catch (error) {
      message.error('Error cargando catálogos');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;

      const filters = {
        search: searchText || undefined,
        provincia_id: filterProvincia || undefined,
        municipio_id: filterMunicipio || undefined,
        categoria_id: filterCategoria || undefined,
        estado: filterEstado || undefined,
        tipo: filterTipo || undefined,
        fecha_inicio: filterDateRange?.[0]?.format('YYYY-MM-DD') || undefined,
        fecha_fin: filterDateRange?.[1]?.format('YYYY-MM-DD') || undefined,
        limit: pageSize,
        offset
      };

      const result = await oposicionesService.getOposicionesAdmin(filters);
      setOposiciones(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setFilterProvincia(null);
    setFilterMunicipio(null);
    setFilterCategoria(null);
    setFilterEstado(null);
    setFilterTipo(null);
    setFilterDateRange(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchText || filterProvincia || filterMunicipio || filterCategoria || filterEstado || filterTipo || filterDateRange;

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 10);
  };

  const startEditing = (record: OposicionAdmin) => {
    setEditingKey(record.id);
    setEditedRow({ ...record });
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditedRow({});
  };

  const saveRow = async (id: number) => {
    setSavingId(id);
    try {
      await oposicionesService.updateOposicion({
        id,
        categoria: editedRow.categoria_id,
        tipo: editedRow.tipo,
        estado: editedRow.estado,
        url_bases_oficiales: editedRow.url_bases_oficiales,
        fecha_convocatoria: editedRow.fecha_convocatoria,
        fecha_fin: editedRow.fecha_fin,
        observaciones: editedRow.observaciones
      });

      message.success('Oposición actualizada correctamente');
      setEditingKey(null);
      setEditedRow({});
      loadData();
    } catch (error) {
      message.error('Error al actualizar la oposición');
    } finally {
      setSavingId(null);
    }
  };
  console.log();

  const handleFieldChange = (field: keyof OposicionAdmin, value: any) => {
    setEditedRow(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateOposicion = async (values: any) => {
    setCreatingOposicion(true);
    try {
      const provincia = provincias.find(p => p.id === values.provincia_id);
      const categoria = categorias.find(c => c.id === values.categoria_id);

      await oposicionesService.createOposicion({
        provincia_nombre: provincia?.nombre || '',
        categoria_nombre: categoria?.nombre || '',
        ccaa: values.ccaa,
        num_plazas: values.num_plazas,
        url_bases_oficiales: values.url_bases_oficiales,
        fecha_convocatoria: values.fecha_convocatoria.format('YYYY-MM-DD'),
        tipo: values.tipo,
        provincia_id: values.provincia_id,
        convocante: values.convocante,
        municipio_id: values.municipio_id,
        categoria_id: values.categoria_id,
        estado: values.estado,
        fecha_fin: values.fecha_fin ? values.fecha_fin.format('YYYY-MM-DD') : undefined,
        observaciones: values.observaciones
      });

      message.success('Oposición creada correctamente');
      setAddOposicionModal(false);
      createForm.resetFields();
      setCurrentPage(1);
      loadData();
    } catch (error) {
      message.error('Error al crear la oposición');
    } finally {
      setCreatingOposicion(false);
    }
  };

  const openRecursoModal = (oposicionId: number) => {
    setSelectedOposicionId(oposicionId);
    setAddRecursoModal(true);
    setRecursoType('file');
    setFileList([]);
    recursoForm.resetFields();
  };

  const handleAddRecurso = async (values: any) => {
    if (!selectedOposicionId) return;

    setUploadingRecurso(true);
    try {
      const formData = new FormData();
      formData.append('oposicion_id', selectedOposicionId.toString());
      formData.append('titulo', values.titulo);

      if (recursoType === 'file') {
        if (fileList.length === 0) {
          message.error('Por favor seleccione un archivo');
          setUploadingRecurso(false);
          return;
        }
        formData.append('data', fileList[0].originFileObj as File);
      } else {
        if (!values.url) {
          message.error('Por favor ingrese una URL');
          setUploadingRecurso(false);
          return;
        }
        formData.append('url', values.url);
      }

      await recursosService.uploadRecurso(formData);

      message.success('Recurso agregado correctamente');
      setAddRecursoModal(false);
      recursoForm.resetFields();
      setFileList([]);
      setSelectedOposicionId(null);
    } catch (error) {
      message.error('Error al agregar el recurso');
    } finally {
      setUploadingRecurso(false);
    }
  };

  const handleAddProvincia = async () => {
    if (!newItemName.trim()) return;
    setAddingItem(true);
    try {
      await provinciasService.createProvincia(newItemName.trim());
      message.success('Provincia creada correctamente');
      setAddProvinciaModal(false);
      setNewItemName('');
      loadCatalogs();
    } catch (error) {
      message.error('Error al crear la provincia');
    } finally {
      setAddingItem(false);
    }
  };

  const handleAddMunicipio = async () => {
    if (!newItemName.trim()) return;
    setAddingItem(true);
    try {
      await municipiosService.createMunicipio(newItemName.trim());
      message.success('Municipio creado correctamente');
      setAddMunicipioModal(false);
      setNewItemName('');
      loadCatalogs();
    } catch (error) {
      message.error('Error al crear el municipio');
    } finally {
      setAddingItem(false);
    }
  };

  const handleAddCategoria = async () => {
    if (!newItemName.trim()) return;
    setAddingItem(true);
    try {
      await categoriasService.createCategoria(newItemName.trim());
      message.success('Categoría creada correctamente');
      setAddCategoriaModal(false);
      setNewItemName('');
      loadCatalogs();
    } catch (error) {
      message.error('Error al crear la categoría');
    } finally {
      setAddingItem(false);
    }
  };

  const renderSelectWithAdd = (
    value: number | undefined,
    options: { id: number; nombre: string }[],
    field: keyof OposicionAdmin,
    onAddClick: () => void,
    placeholder: string
  ) => {
    return (
      <Select
        value={value}
        onChange={(val) => handleFieldChange(field, val)}
        className="admin-select"
        placeholder={placeholder}
        popupClassName="admin-select-dropdown"
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={onAddClick}
              className="add-option-btn"
            >
              Agregar nuevo
            </Button>
          </>
        )}
      >
        {options.map(opt => (
          <Option key={opt.id} value={opt.id}>{opt.nombre}</Option>
        ))}
      </Select>
    );
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Abierta': return 'success';
      case 'Cerrada': return 'error';
      case 'En curso': return 'processing';
      default: return 'default';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Convocatoria': return '#5BE4EB';
      case 'Oferta': return '#3ABBC2';
      default: return '#6b7280';
    }
  };

  const handleSolicitarTemario = async (id: number) => {
    try {

      const payload = {
        user_id: parseInt(user?.id || '0'),
        oposicion_id: id
      };

      const response = await oposicionesService.compararTemario(payload);

      if (typeof response === 'string') {
        message.info(response);
        return;
      }

    } catch (error) {
      message.error('Error al solicitar el temario');
    }
  };

  const columns: ColumnsType<OposicionAdmin> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 170,
      render: (id) => <Text strong className="id-cell">#{id}</Text>
    },
    {
      title: 'Título',
      dataIndex: 'titulo',
      key: 'titulo',
      width: 220,
      ellipsis: true,
      render: (titulo) => (
        <Tooltip title={titulo}>
          <Text className="title-cell">{titulo}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Provincia',
      dataIndex: 'nombre_provincia',
      key: 'nombre_provincia',
      width: 140,
      render: (nombre) => <Tag className="tipo-tag">{nombre}</Tag>
    },
    {
      title: 'Municipio',
      dataIndex: 'nombre_municipio',
      key: 'nombre_municipio',
      width: 270,
      render: (nombre) => nombre ? (
        <Tag className="tipo-tag">{nombre}</Tag>
      ) : (
        <Text type="secondary">-</Text>
      )
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria_id',
      width: 270,
      render: (_, record) => {
        if (editingKey === record.id) {
          return renderSelectWithAdd(
            editedRow.categoria_id,
            categorias,
            'categoria_id',
            () => setAddCategoriaModal(true),
            'Seleccionar'
          );
        }
        return <Tag color="purple">{record.nombre_categoria}</Tag>;
      }
    },
    {
      title: 'Plazas',
      dataIndex: 'num_plazas',
      key: 'num_plazas',
      width: 90,
      align: 'center',
      render: (plazas) => <Badge count={plazas} showZero color="#5BE4EB" />
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 130,
      render: (_, record) => {
        if (editingKey === record.id) {
          return (
            <Select
              value={editedRow.tipo}
              onChange={(val) => handleFieldChange('tipo', val)}
              className="admin-select"
            >
              {TIPOS_OPOSICION.map(tipo => (
                <Option key={tipo} value={tipo}>{tipo}</Option>
              ))}
            </Select>
          );
        }
        return (
          <Tag
            color={getTipoColor(record.tipo)}
            className="tipo-tag"
          >
            {record.tipo}
          </Tag>
        );
      }
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 120,
      render: (_, record) => {
        if (editingKey === record.id) {
          return (
            <Select
              value={editedRow.estado}
              onChange={(val) => handleFieldChange('estado', val)}
              className="admin-select"
            >
              {ESTADOS_OPOSICION.map(estado => (
                <Option key={estado} value={estado}>{estado}</Option>
              ))}
            </Select>
          );
        }
        return (
          <Badge
            status={getEstadoColor(record.estado) as any}
            text={record.estado}
            className="estado-badge"
          />
        );
      }
    },
    {
      title: 'Fecha Conv.',
      dataIndex: 'fecha_convocatoria',
      key: 'fecha_convocatoria',
      width: 140,
      render: (_, record) => {
        if (editingKey === record.id) {
          return (
            <DatePicker
              value={editedRow.fecha_convocatoria ? dayjs(editedRow.fecha_convocatoria) : null}
              onChange={(date) => handleFieldChange('fecha_convocatoria', date?.format('YYYY-MM-DD'))}
              format="DD/MM/YYYY"
              className="admin-datepicker"
            />
          );
        }
        return record.fecha_convocatoria ? (
          <Space size={4}>
            <CalendarOutlined style={{ color: '#5BE4EB' }} />
            <Text>{dayjs(record.fecha_convocatoria).format('DD/MM/YYYY')}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        );
      }
    },
    {
      title: 'URL',
      dataIndex: 'url_bases_oficiales',
      key: 'url_bases_oficiales',
      width: 300,
      render: (_, record) => {
        if (editingKey === record.id) {
          return (
            <Input
              value={editedRow.url_bases_oficiales}
              onChange={(e) => handleFieldChange('url_bases_oficiales', e.target.value)}
              placeholder="URL"
              className="admin-input"
            />
          );
        }
        return record.url_bases_oficiales ? (
          <Tooltip title="Ver bases oficiales">
            <Button
              type="link"
              href={record.url_bases_oficiales}
              target="_blank"
              icon={<LinkOutlined />}
              className="link-btn"
            >
              Ver bases
            </Button>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        );
      }
    },
    {
      title: 'Observaciones',
      dataIndex: 'observaciones',
      key: 'observaciones',
      width: 250,
      ellipsis: true,
      render: (_, record) => {
        if (editingKey === record.id) {
          return (
            <TextArea
              value={editedRow.observaciones}
              onChange={(e) => handleFieldChange('observaciones', e.target.value)}
              placeholder="Observaciones"
              className="admin-input"
              rows={2}
            />
          );
        }
        return record.observaciones ? (
          <Tooltip title={record.observaciones}>
            <Text ellipsis>{record.observaciones === null || record.observaciones === undefined || record.observaciones === 'null' ? '-' : record.observaciones}</Text>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        );
      }
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 530,
      render: (_, record) => {
        if (editingKey === record.id) {
          return (
            <Space size={4}>
              <Tooltip title="Guardar">
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  size="small"
                  loading={savingId === record.id}
                  onClick={() => saveRow(record.id)}
                  className="save-btn"
                />
              </Tooltip>
              <Tooltip title="Cancelar">
                <Button
                  icon={<CloseOutlined />}
                  size="small"
                  onClick={cancelEditing}
                  className="cancel-btn"
                />
              </Tooltip>
            </Space>
          );
        }
        return (
          <Space size={4}>
            <Tooltip title="Modifica los campos disponibles">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => startEditing(record)}
                disabled={editingKey !== null}
                className="edit-btn"
              >
                Editar
              </Button>
            </Tooltip>
            <Tooltip title="Agregar todos los archivos correspondientes a esta convocatoria">
              <Button
                type="text"
                icon={<FileAddOutlined />}
                onClick={() => openRecursoModal(record.id)}
                disabled={editingKey !== null}
                className="edit-btn"
              >
                Aregar archivo
              </Button>
            </Tooltip>
            <Tooltip title={record.tiene_temario_listo ? "Temario ya disponible para guardar" : "Solicita un temario"}>
              <Button
                type="text"
                icon={<FileAddOutlined />}
                onClick={() => handleSolicitarTemario(record.id)}
                disabled={editingKey !== null}
                className="edit-btn"
              >
                {record.tiene_temario_listo ? "Agregar a mis Convocatorias" : "Solicitar Temario"}
              </Button>
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  return (
    <motion.div
      className="admin-oposiciones"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="admin-header">
        <div className="header-content">
          <Title level={2} className="admin-title">
            Gestión de Oposiciones
          </Title>
          <Text type="secondary" className="admin-subtitle">
            Administra y edita las oposiciones del sistema
          </Text>
        </div>
        <div className="header-stats">
          <Card size="small" className="stat-card">
            <Text type="secondary">Total</Text>
            <Title level={3}>{total}</Title>
          </Card>
          <Card size="small" className="stat-card">
            <Text type="secondary">Página</Text>
            <Title level={3}>{currentPage}</Title>
          </Card>
        </div>
      </div>

      <Card className="filters-card">
        <div className="filters-header">
          <Space>
            <FilterOutlined />
            <Text strong>Filtros</Text>
            {hasActiveFilters && (
              <Badge count={[searchText, filterProvincia, filterMunicipio, filterCategoria, filterEstado, filterTipo, filterDateRange].filter(Boolean).length} />
            )}
          </Space>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddOposicionModal(true)}
            >
              Nueva Oposición
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              Recargar
            </Button>
            {hasActiveFilters && (
              <Button onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </Space>
        </div>

        <div className="filters-content">
          <Input
            placeholder="Buscar por título, provincia, municipio..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
            allowClear
          />

          <Select
            placeholder="Provincia"
            value={filterProvincia}
            onChange={(value) => {
              setFilterProvincia(value);
              setCurrentPage(1);
            }}
            className="filter-select-sm"
            allowClear
          >
            {provincias.map(p => (
              <Option key={p.id} value={p.id}>{p.nombre}</Option>
            ))}
          </Select>

          <Select
            placeholder="Municipio"
            value={filterMunicipio}
            onChange={(value) => {
              setFilterMunicipio(value);
              setCurrentPage(1);
            }}
            className="filter-select-sm"
            allowClear
          >
            {municipios.map(m => (
              <Option key={m.id} value={m.id}>{m.nombre}</Option>
            ))}
          </Select>

          <Select
            placeholder="Categoría"
            value={filterCategoria}
            onChange={(value) => {
              setFilterCategoria(value);
              setCurrentPage(1);
            }}
            className="filter-select-sm"
            allowClear
          >
            {categorias.map(c => (
              <Option key={c.id} value={c.id}>{c.nombre}</Option>
            ))}
          </Select>

          <Select
            placeholder="Estado"
            value={filterEstado}
            onChange={(value) => {
              setFilterEstado(value);
              setCurrentPage(1);
            }}
            className="filter-select-sm"
            allowClear
          >
            {ESTADOS_OPOSICION.map(e => (
              <Option key={e} value={e}>{e}</Option>
            ))}
          </Select>

          <Select
            placeholder="Tipo"
            value={filterTipo}
            onChange={(value) => {
              setFilterTipo(value);
              setCurrentPage(1);
            }}
            className="filter-select-sm"
            allowClear
          >
            {TIPOS_OPOSICION.map(t => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>

          <RangePicker
            placeholder={['Fecha inicio', 'Fecha fin']}
            value={filterDateRange}
            onChange={(dates) => {
              setFilterDateRange(dates);
              setCurrentPage(1);
            }}
            format="DD/MM/YYYY"
            className="date-range-picker"
          />
        </div>
      </Card>

      <Card className="table-card">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip="Cargando oposiciones..." />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={oposiciones}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => (
                <Text type="secondary">
                  {range[0]}-{range[1]} de {total} registros
                </Text>
              ),
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              }
            }}
            onChange={handleTableChange}
            scroll={{ x: 2000 }}
            size="middle"
            className="admin-table"
            rowClassName={(record) =>
              editingKey === record.id ? 'editing-row' : ''
            }
          />
        )}
      </Card>

      {/* Modal para agregar recurso */}
      <Modal
        title="Agregar Recurso a Oposición"
        open={addRecursoModal}
        onCancel={() => {
          setAddRecursoModal(false);
          recursoForm.resetFields();
          setFileList([]);
          setSelectedOposicionId(null);
        }}
        footer={null}
        width={600}
        className="admin-modal"
      >
        <Form
          form={recursoForm}
          layout="vertical"
          onFinish={handleAddRecurso}
        >
          <Form.Item
            name="titulo"
            label="Título del Recurso"
            rules={[{ required: true, message: 'Ingrese el título del recurso' }]}
          >
            <Input placeholder="Ej: Temario oficial 2024" />
          </Form.Item>

          <Form.Item label="Tipo de Recurso">
            <Radio.Group
              value={recursoType}
              onChange={(e) => {
                setRecursoType(e.target.value);
                setFileList([]);
                recursoForm.setFieldsValue({ url: undefined });
              }}
            >
              <Radio.Button value="file">
                <UploadOutlined /> Subir Archivo
              </Radio.Button>
              <Radio.Button value="url">
                <LinkOutlined /> Enlace URL
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {recursoType === 'file' ? (
            <Form.Item label="Archivo">
              <Upload
                beforeUpload={() => false}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Seleccionar Archivo</Button>
              </Upload>
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Todos los formatos son aceptados.
              </Text>
            </Form.Item>
          ) : (
            <Form.Item
              name="url"
              label="URL del Recurso"
              rules={[
                { required: true, message: 'Ingrese la URL' },
                { type: 'url', message: 'Ingrese una URL válida' }
              ]}
            >
              <Input placeholder="https://ejemplo.com/recurso.pdf" />
            </Form.Item>
          )}

          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => {
                setAddRecursoModal(false);
                recursoForm.resetFields();
                setFileList([]);
                setSelectedOposicionId(null);
              }}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={uploadingRecurso}>
                Agregar Recurso
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para crear oposición */}
      <Modal
        title="Crear Nueva Oposición"
        open={addOposicionModal}
        onCancel={() => {
          setAddOposicionModal(false);
          createForm.resetFields();
        }}
        footer={null}
        width={700}
        className="admin-modal"
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateOposicion}
        >
          <Form.Item
            name="provincia_id"
            label="Provincia"
            rules={[{ required: true, message: 'Seleccione una provincia' }]}
          >
            <Select placeholder="Seleccionar provincia">
              {provincias.map(p => (
                <Option key={p.id} value={p.id}>{p.nombre}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="municipio_id"
            label="Municipio"
          >
            <Select placeholder="Seleccionar municipio" allowClear>
              {municipios.map(m => (
                <Option key={m.id} value={m.id}>{m.nombre}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="categoria_id"
            label="Categoría"
            rules={[{ required: true, message: 'Seleccione una categoría' }]}
          >
            <Select placeholder="Seleccionar categoría">
              {categorias.map(c => (
                <Option key={c.id} value={c.id}>{c.nombre}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="convocante"
            label="Convocante"
            rules={[{ required: true, message: 'Ingrese el convocante' }]}
          >
            <Input placeholder="Ej: Ayuntamiento de Madrid" />
          </Form.Item>

          <Form.Item
            name="ccaa"
            label="CCAA"
          >
            <Input placeholder="Comunidad Autónoma" />
          </Form.Item>

          <Form.Item
            name="num_plazas"
            label="Número de Plazas"
            rules={[{ required: true, message: 'Ingrese el número de plazas' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="tipo"
            label="Tipo"
            rules={[{ required: true, message: 'Seleccione el tipo' }]}
          >
            <Select>
              {TIPOS_OPOSICION.map(tipo => (
                <Option key={tipo} value={tipo}>{tipo}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="estado"
            label="Estado"
            rules={[{ required: true, message: 'Seleccione el estado' }]}
          >
            <Select>
              {ESTADOS_OPOSICION.map(estado => (
                <Option key={estado} value={estado}>{estado}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="url_bases_oficiales"
            label="URL Bases Oficiales"
            rules={[
              { required: true, message: 'Ingrese la URL' },
              { type: 'url', message: 'Ingrese una URL válida' }
            ]}
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item
            name="fecha_convocatoria"
            label="Fecha de Convocatoria"
            rules={[{ required: true, message: 'Seleccione la fecha' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="fecha_fin"
            label="Fecha de Fin"
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="observaciones"
            label="Observaciones"
          >
            <TextArea rows={3} placeholder="Observaciones adicionales..." />
          </Form.Item>

          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => {
                setAddOposicionModal(false);
                createForm.resetFields();
              }}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={creatingOposicion}>
                Crear Oposición
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modales de provincia, municipio y categoría (sin cambios) */}
      <Modal
        title="Agregar Nueva Provincia"
        open={addProvinciaModal}
        onOk={handleAddProvincia}
        onCancel={() => { setAddProvinciaModal(false); setNewItemName(''); }}
        confirmLoading={addingItem}
        className="admin-modal"
      >
        <Form layout="vertical">
          <Form.Item label="Nombre de la provincia">
            <Input
              ref={inputRef}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Ingrese el nombre"
              onPressEnter={handleAddProvincia}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Agregar Nuevo Municipio"
        open={addMunicipioModal}
        onOk={handleAddMunicipio}
        onCancel={() => { setAddMunicipioModal(false); setNewItemName(''); }}
        confirmLoading={addingItem}
        className="admin-modal"
      >
        <Form layout="vertical">
          <Form.Item label="Nombre del municipio">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Ingrese el nombre"
              onPressEnter={handleAddMunicipio}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Agregar Nueva Categoría"
        open={addCategoriaModal}
        onOk={handleAddCategoria}
        onCancel={() => { setAddCategoriaModal(false); setNewItemName(''); }}
        confirmLoading={addingItem}
        className="admin-modal"
      >
        <Form layout="vertical">
          <Form.Item label="Nombre de la categoría">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Ingrese el nombre"
              onPressEnter={handleAddCategoria}
            />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default AdminOposiciones;