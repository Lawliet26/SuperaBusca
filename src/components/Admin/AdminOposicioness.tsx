import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { notify } from '@/utils/notify';
import {
  Table,
  Select,
  Input,
  Button,
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
  Radio,
  Tabs,
  ConfigProvider,
  theme
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
  UploadOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  SolutionOutlined,
  DeleteOutlined,
  WarningOutlined,
  SwapOutlined,
  UserOutlined,
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
import AdminUsuarios from './AdminUsuarios';
import AdminHistorico from './AdminHistorico';
import AdminActividades from './AdminActividades';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const TIPOS_OPOSICION = ['Convocatoria', 'Oferta'];
const ESTADOS_OPOSICION = ['Abierta', 'Cerrada', 'En curso'];

const AdminOposiciones: React.FC = () => {
  const { user, isProfesor, isAdmin } = useAuth();
  const ADMIN_TAB_KEY = 'oporadar_admin_tab';
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem(ADMIN_TAB_KEY);
    return saved === 'usuarios' || saved === 'historico' || saved === 'actividades' || saved === 'oposiciones'
      ? saved
      : 'oposiciones';
  });

  // Recuerda la tab activa entre recargas
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    localStorage.setItem(ADMIN_TAB_KEY, key);
  };

  // Si un profesor tuviera guardada una tab solo-admin, lo devolvemos a Oposiciones
  useEffect(() => {
    if (isProfesor && activeTab !== 'oposiciones') {
      setActiveTab('oposiciones');
      localStorage.setItem(ADMIN_TAB_KEY, 'oposiciones');
    }
  }, [isProfesor, activeTab]);
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
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

  const handleGestionarOposicion = (nombre: string) => {
    setSearchText(nombre);
    setCurrentPage(1);
    handleTabChange('oposiciones');
  };
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
  const [recursoType, setRecursoType] = useState<'file' | 'url' | 'relacion'>('file');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Ver recursos modal
  const [recursoViewModal, setRecursoViewModal] = useState(false);
  const [recursoViewList, setRecursoViewList] = useState<any[]>([]);
  const [recursoViewLoading, setRecursoViewLoading] = useState(false);
  const [recursoViewTitulo, setRecursoViewTitulo] = useState('');
  const [recursoViewOposicionId, setRecursoViewOposicionId] = useState<number | null>(null);
  const [relacionWarningVisible, setRelacionWarningVisible] = useState(false);

  // Eliminación de catálogos (categoría/provincia/municipio) con reasignación
  type CatalogoTipo = 'categoria' | 'provincia' | 'municipio';
  const [deletingCatalog, setDeletingCatalog] = useState(false);
  const [reassignModal, setReassignModal] = useState<{ tipo: CatalogoTipo; id: number; nombre: string; enUso: number; oposiciones: { id: number; titulo: string }[] } | null>(null);
  const [reassignTo, setReassignTo] = useState<number | undefined>(undefined);

  // Ver solicitantes del temario
  const [solicitantesModal, setSolicitantesModal] = useState<{ titulo: string } | null>(null);
  const [solicitantes, setSolicitantes] = useState<{ num: number; email: string }[]>([]);
  const [solicitantesLoading, setSolicitantesLoading] = useState(false);
  // Búsqueda que se le impone a la tab de Usuarios al saltar desde un solicitante
  const [usuariosSearch, setUsuariosSearch] = useState<string>('');

  const verUsuarioEnGestion = (email: string) => {
    setUsuariosSearch(email);
    setSolicitantesModal(null);
    handleTabChange('usuarios');
  };

  const openSolicitantes = async (record: OposicionAdmin) => {
    setSolicitantesModal({ titulo: record.titulo });
    setSolicitantes([]);
    setSolicitantesLoading(true);
    try {
      const data = await oposicionesService.getSolicitantes(record.id);
      setSolicitantes(data);
    } catch {
      notify.error('Error al cargar los solicitantes');
    } finally {
      setSolicitantesLoading(false);
    }
  };

  const openRecursoView = async (record: OposicionAdmin) => {
    setRecursoViewTitulo(record.titulo);
    setRecursoViewOposicionId(record.id);
    setRecursoViewModal(true);
    setRecursoViewLoading(true);
    try {
      const data = await recursosService.getRecursosByOposicion(record.id);
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
    if (recursoViewOposicionId) {
      setSelectedOposicionId(recursoViewOposicionId);
      setRecursoType('relacion');
      setFileList([]);
      recursoForm.resetFields();
      setAddRecursoModal(true);
    }
  };

  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(normalize(searchText));
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, debouncedSearch, filterProvincia, filterMunicipio, filterCategoria, filterEstado, filterTipo, filterDateRange]);

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
      notify.error('Error cargando catálogos');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;

      const filters = {
        search: debouncedSearch || undefined,
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
      console.log(result);
      
      setOposiciones([...result.data].sort((a, b) => b.id - a.id));
      setTotal(result.total);
    } catch (error) {
      notify.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setDebouncedSearch('');
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
      const updatePayload = isProfesor
        ? { id, url_bases_oficiales: editedRow.url_bases_oficiales }
        : {
          id,
          titulo: editedRow.titulo,
          categoria: editedRow.categoria_id,
          provincia_id: editedRow.provincia_id,
          municipio_id: editedRow.municipio_id,
          tipo: editedRow.tipo,
          estado: editedRow.estado,
          num_plazas: editedRow.num_plazas,
          url_bases_oficiales: editedRow.url_bases_oficiales,
          url_convocatoria: editedRow.url_convocatoria,
          fecha_convocatoria: editedRow.fecha_convocatoria,
          fecha_fin: editedRow.fecha_fin,
          observaciones: editedRow.observaciones,
          compania: editedRow.compania
        };
      await oposicionesService.updateOposicion(updatePayload);

      notify.success('Oposición actualizada correctamente');
      setEditingKey(null);
      setEditedRow({});
      loadData();
    } catch (error) {
      notify.error('Error al actualizar la oposición');
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
        url_convocatoria: values.url_convocatoria,
        fecha_convocatoria: values.fecha_convocatoria.format('YYYY-MM-DD'),
        tipo: values.tipo,
        provincia_id: values.provincia_id,
        convocante: values.convocante,
        municipio_id: values.municipio_id,
        categoria_id: values.categoria_id,
        estado: values.estado,
        fecha_fin: values.fecha_fin ? values.fecha_fin.format('YYYY-MM-DD') : undefined,
        observaciones: values.observaciones,
        compania: values.compania
      });

      notify.success('Oposición creada correctamente');
      setAddOposicionModal(false);
      createForm.resetFields();
      setCurrentPage(1);
      loadData();
    } catch (error) {
      notify.error('Error al crear la oposición');
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
      if (recursoType === 'relacion') {
        if (fileList.length === 0) {
          notify.error('Por favor seleccione un archivo PDF');
          setUploadingRecurso(false);
          return;
        }
        const file = fileList[0].originFileObj as File;
        if (file.type !== 'application/pdf') {
          notify.error('Solo se aceptan archivos PDF');
          setUploadingRecurso(false);
          return;
        }
        await recursosService.uploadRelacionTemario(selectedOposicionId, file);
        notify.success('Relación de temario cargada correctamente');
      } else {
        const formData = new FormData();
        formData.append('oposicion_id', selectedOposicionId.toString());
        formData.append('titulo', values.titulo);

        if (recursoType === 'file') {
          if (fileList.length === 0) {
            notify.error('Por favor seleccione un archivo');
            setUploadingRecurso(false);
            return;
          }
          formData.append('data', fileList[0].originFileObj as File);
        } else {
          if (!values.url) {
            notify.error('Por favor ingrese una URL');
            setUploadingRecurso(false);
            return;
          }
          formData.append('url', values.url);
        }

        await recursosService.uploadRecurso(formData);
        notify.success('Recurso agregado correctamente');
      }

      setAddRecursoModal(false);
      recursoForm.resetFields();
      setFileList([]);
      setSelectedOposicionId(null);
    } catch (error) {
      notify.error('Error al agregar el recurso');
    } finally {
      setUploadingRecurso(false);
    }
  };

  const handleAddProvincia = async () => {
    if (!newItemName.trim()) return;
    setAddingItem(true);
    try {
      await provinciasService.createProvincia(newItemName.trim());
      notify.success('Provincia creada correctamente');
      setAddProvinciaModal(false);
      setNewItemName('');
      loadCatalogs();
    } catch (error) {
      notify.error('Error al crear la provincia');
    } finally {
      setAddingItem(false);
    }
  };

  const handleAddMunicipio = async () => {
    if (!newItemName.trim()) return;
    setAddingItem(true);
    try {
      await municipiosService.createMunicipio(newItemName.trim());
      notify.success('Municipio creado correctamente');
      setAddMunicipioModal(false);
      setNewItemName('');
      loadCatalogs();
    } catch (error) {
      notify.error('Error al crear el municipio');
    } finally {
      setAddingItem(false);
    }
  };

  const handleAddCategoria = async () => {
    if (!newItemName.trim()) return;
    setAddingItem(true);
    try {
      await categoriasService.createCategoria(newItemName.trim());
      notify.success('Categoría creada correctamente');
      setAddCategoriaModal(false);
      setNewItemName('');
      loadCatalogs();
    } catch (error) {
      notify.error('Error al crear la categoría');
    } finally {
      setAddingItem(false);
    }
  };


  const CATALOGO_LABEL: Record<CatalogoTipo, string> = {
    categoria: 'categoría',
    provincia: 'provincia',
    municipio: 'municipio',
  };

  const deleteCatalogo = (tipo: CatalogoTipo, id: number, reassignTo?: number) => {
    if (tipo === 'categoria') return categoriasService.deleteCategoria(id, reassignTo);
    if (tipo === 'provincia') return provinciasService.deleteProvincia(id, reassignTo);
    return municipiosService.deleteMunicipio(id, reassignTo);
  };

  // Intento de borrado: si el backend dice que está en uso, abrimos el modal de reasignación
  const intentarBorrarCatalogo = async (tipo: CatalogoTipo, item: { id: number; nombre: string }) => {
    setDeletingCatalog(true);
    try {
      const res = await deleteCatalogo(tipo, item.id);
      if (res.borrado) {
        notify.success(`Se eliminó la ${CATALOGO_LABEL[tipo]} correctamente`);
        await loadCatalogs();
        loadData();
      } else {
        setReassignTo(undefined);
        setReassignModal({ tipo, id: item.id, nombre: item.nombre, enUso: res.en_uso, oposiciones: res.oposiciones || [] });
      }
    } catch {
      notify.error('No se pudo eliminar (¿tenés permisos de administrador?)');
    } finally {
      setDeletingCatalog(false);
    }
  };

  const confirmDeleteCatalogo = (tipo: CatalogoTipo, item: { id: number; nombre: string }) => {
    Modal.confirm({
      title: `¿Eliminar la ${CATALOGO_LABEL[tipo]} "${item.nombre}"?`,
      icon: <WarningOutlined style={{ color: '#d97706' }} />,
      content: 'Si está en uso por alguna oposición, te pediremos con qué valor reemplazarla antes de borrarla.',
      okText: 'Eliminar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: () => intentarBorrarCatalogo(tipo, item),
    });
  };

  const confirmarReasignarYBorrar = async () => {
    if (!reassignModal || reassignTo == null) return;
    setDeletingCatalog(true);
    try {
      const res = await deleteCatalogo(reassignModal.tipo, reassignModal.id, reassignTo);
      if (res.borrado) {
        notify.success(`Se reasignaron ${res.reasignadas} oposición(es) y se eliminó la ${CATALOGO_LABEL[reassignModal.tipo]}`);
        setReassignModal(null);
        setReassignTo(undefined);
        await loadCatalogs();
        loadData();
      } else {
        notify.error('No se pudo eliminar');
      }
    } catch {
      notify.error('Error al reasignar y eliminar');
    } finally {
      setDeletingCatalog(false);
    }
  };

  // Opciones de reemplazo: los demás items del mismo catálogo (excluye el que se borra)
  const opcionesReasignacion = useMemo(() => {
    if (!reassignModal) return [];
    const lista = reassignModal.tipo === 'categoria' ? categorias : reassignModal.tipo === 'provincia' ? provincias : municipios;
    return lista.filter((x) => x.id !== reassignModal.id).map((x) => ({ value: x.id, label: x.nombre }));
  }, [reassignModal, categorias, provincias, municipios]);

  const confirmDeleteOposicion = (record: OposicionAdmin) => {
    Modal.confirm({
      title: `¿Eliminar la oposición "${record.titulo}"?`,
      icon: <WarningOutlined style={{ color: '#d97706' }} />,
      width: 520,
      content: (
        <span>
          Se eliminarán también las <strong>solicitudes de temario</strong> y todo lo asociado
          (temarios, revisiones y recursos) de esta oposición. Esto puede afectar análisis posteriores.
          Esta acción <strong>no se puede deshacer</strong>.
        </span>
      ),
      okText: 'Eliminar definitivamente',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await oposicionesService.deleteOposicion(record.id);
          notify.success('Oposición eliminada correctamente');
          loadData();
        } catch {
          notify.error('No se pudo eliminar la oposición');
        }
      },
    });
  };

  // Render de cada opción del select de catálogo con botón de eliminar (solo admin)
  const renderCatalogoOption = (tipo: CatalogoTipo) => (option: { value: any; label: any }) => {
    if (!isAdmin) return option.label;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option.label}</span>
        <DeleteOutlined
          style={{ color: '#ef4444', flexShrink: 0 }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            confirmDeleteCatalogo(tipo, { id: Number(option.value), nombre: String(option.label) });
          }}
        />
      </div>
    );
  };

  const renderSelectWithAdd = (
    value: number | undefined,
    options: { id: number; nombre: string }[],
    field: keyof OposicionAdmin,
    onAddClick: () => void,
    placeholder: string
  ) => {
    const tipo: CatalogoTipo | null =
      field === 'provincia_id' ? 'provincia' : field === 'municipio_id' ? 'municipio' : field === 'categoria_id' ? 'categoria' : null;
    return (
      <Select
        showSearch
        optionFilterProp="label"
        value={value}
        onChange={(val) => handleFieldChange(field, val)}
        className="admin-select"
        placeholder={placeholder}
        options={options.map(opt => ({ value: opt.id, label: opt.nombre }))}
        {...(tipo ? { optionRender: renderCatalogoOption(tipo) } : {})}
        classNames={{ popup: { root: 'admin-select-dropdown' } }}
        // @ts-ignore — dropdownRender deprecated in AntD v6 types but no functional replacement exists
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
      />
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
      case 'Convocatoria': return '#23C27B';
      case 'Oferta': return '#2A4F82';
      default: return '#6b7280';
    }
  };

  const handleSolicitarTemario = async (id: number) => {
    try {

      const payload = {
        user_id: parseInt(user?.id || '0'),
        oposicion_id: id
      };

      const response = await oposicionesService.compararTemarioAdmin(payload);

      if (typeof response === 'string') {
        notify.info(response);
        return;
      }

    } catch (error) {
      notify.error('Error al solicitar el temario');
    }
  };

  const columns: ColumnsType<OposicionAdmin> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 170,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'descend',
      render: (id) => <Text strong className="id-cell">#{id}</Text>
    },
    {
      title: 'Título',
      dataIndex: 'titulo',
      key: 'titulo',
      width: 220,
      ellipsis: true,
      render: (_, record) => {
        if (editingKey === record.id && !isProfesor) {
          return (
            <Input
              value={editedRow.titulo}
              onChange={(e) => handleFieldChange('titulo', e.target.value)}
              className="admin-input"
            />
          );
        }
        return (
          <Tooltip title={record.titulo}>
            <Text className="title-cell">{record.titulo}</Text>
          </Tooltip>
        );
      }
    },
    {
      title: 'Estudiantes',
      dataIndex: 'total_estudiantes',
      key: 'total_estudiantes',
      width: 100,
      align: 'center' as const,
      render: (val: number) => (
        <Text>{val ?? 0}</Text>
      )
    },
    {
      title: 'Provincia',
      dataIndex: 'nombre_provincia',
      key: 'nombre_provincia',
      width: 160,
      render: (_, record) => {
        if (editingKey === record.id && !isProfesor) {
          return renderSelectWithAdd(
            editedRow.provincia_id,
            provincias,
            'provincia_id',
            () => setAddProvinciaModal(true),
            'Seleccionar'
          );
        }
        return <Tag className="tipo-tag">{record.nombre_provincia}</Tag>;
      }
    },
    {
      title: 'Municipio',
      dataIndex: 'nombre_municipio',
      key: 'nombre_municipio',
      width: 200,
      render: (_, record) => {
        if (editingKey === record.id && !isProfesor) {
          return renderSelectWithAdd(
            editedRow.municipio_id,
            municipios,
            'municipio_id',
            () => setAddMunicipioModal(true),
            'Seleccionar'
          );
        }
        return record.nombre_municipio ? (
          <Tag className="tipo-tag">{record.nombre_municipio}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        );
      }
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria_id',
      width: 270,
      render: (_, record) => {
        if (editingKey === record.id && !isProfesor) {
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
      render: (_: any, record: OposicionAdmin) => {
        if (editingKey === record.id && !isProfesor) {
          return (
            <InputNumber
              min={0}
              value={editedRow.num_plazas}
              onChange={(val) => handleFieldChange('num_plazas', val ?? 0)}
              className="admin-input"
              style={{ width: 70 }}
            />
          );
        }
        return (
          <span style={{ color: '#23C27B', fontWeight: 600, fontSize: 14 }}>
            {record.num_plazas}
          </span>
        );
      }
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 130,
      render: (_, record) => {
        if (editingKey === record.id && !isProfesor) {
          return (
            <Select
              showSearch
              optionFilterProp="label"
              value={editedRow.tipo}
              onChange={(val) => {
                if (val === 'Convocatoria') {
                  const url = editedRow.url_bases_oficiales ?? record.url_bases_oficiales;
                  if (!url || url.trim() === '') {
                    notify.warning('Para ser una Convocatoria debe tener la URL de bases oficiales, ya que activa la solicitud de temario.');
                    return;
                  }
                }
                handleFieldChange('tipo', val);
              }}
              className="admin-select"
              options={TIPOS_OPOSICION.map(t => ({ value: t, label: t }))}
            />
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
        if (editingKey === record.id && !isProfesor) {
          return (
            <Select
              showSearch
              optionFilterProp="label"
              value={editedRow.estado}
              onChange={(val) => handleFieldChange('estado', val)}
              className="admin-select"
              options={ESTADOS_OPOSICION.map(e => ({ value: e, label: e }))}
            />
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
        if (editingKey === record.id && !isProfesor) {
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
            <CalendarOutlined style={{ color: '#23C27B' }} />
            <Text>{dayjs(record.fecha_convocatoria).format('DD/MM/YYYY')}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        );
      }
    },
    {
      title: 'Fecha Fin.',
      dataIndex: 'fecha_fin',
      key: 'fecha_fin',
      width: 140,
      render: (_, record) => {
        if (editingKey === record.id && !isProfesor) {
          return (
            <DatePicker
              value={editedRow.fecha_fin ? dayjs(editedRow.fecha_fin) : null}
              onChange={(date) => handleFieldChange('fecha_fin', date?.format('YYYY-MM-DD'))}
              format="DD/MM/YYYY"
              className="admin-datepicker"
            />
          );
        }
        return record.fecha_fin ? (
          <Space size={4}>
            <CalendarOutlined style={{ color: '#23C27B' }} />
            <Text>{dayjs(record.fecha_fin).format('DD/MM/YYYY')}</Text>
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
      title: 'URL Convocatoria',
      dataIndex: 'url_convocatoria',
      key: 'url_convocatoria',
      width: 220,
      render: (_, record) => {
        if (editingKey === record.id && !isProfesor) {
          return (
            <Input
              value={editedRow.url_convocatoria}
              onChange={(e) => handleFieldChange('url_convocatoria', e.target.value)}
              placeholder="URL convocatoria"
              className="admin-input"
            />
          );
        }
        return record.url_convocatoria ? (
          <Tooltip title="Ver convocatoria">
            <Button
              type="link"
              href={record.url_convocatoria}
              target="_blank"
              icon={<LinkOutlined />}
              className="link-btn"
            >
              Ver convocatoria
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
        if (editingKey === record.id && !isProfesor) {
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
      title: 'Línea',
      dataIndex: 'compania',
      key: 'compania',
      width: 140,
      render: (_, record) => {
        if (editingKey === record.id && !isProfesor) {
          return (
            <Select
              value={editedRow.compania}
              onChange={(val) => handleFieldChange('compania', val)}
              className="admin-select"
              allowClear
              placeholder="Línea"
              options={[
                { value: 'Supera', label: 'Supera' },
                { value: 'Patrio', label: 'Patrio' },
                { value: 'Otro', label: 'Otro' },
              ]}
            />
          );
        }
        return record.compania ? (
          <Tag color={record.compania === 'Supera' ? 'blue' : record.compania === 'Patrio' ? 'purple' : 'default'}>
            {record.compania}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        );
      }
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 210,
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
            <Tooltip title="Ver recursos de esta oposición">
              <Button
                type="text"
                icon={<FolderOpenOutlined />}
                onClick={() => openRecursoView(record)}
                className="edit-btn"
              />

            </Tooltip>
            <Tooltip title={isProfesor ? "Editar URL de bases oficiales" : "Modifica los campos disponibles"}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => startEditing(record)}
                disabled={editingKey !== null}
                className="edit-btn"
              />

            </Tooltip>
            <Tooltip title="Agregar todos los archivos correspondientes a esta convocatoria">
              <Button
                type="text"
                icon={<FileAddOutlined />}
                onClick={() => openRecursoModal(record.id)}
                disabled={editingKey !== null}
                className="edit-btn"
              />
            </Tooltip>

            <Tooltip title="Ver estudiantes que solicitaron el temario">
              <Button
                type="text"
                icon={<SolutionOutlined />}
                onClick={() => openSolicitantes(record)}
                disabled={editingKey !== null}
                className="edit-btn"
              />
            </Tooltip>

            {isAdmin && (
              <Tooltip title="Eliminar oposición">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => confirmDeleteOposicion(record)}
                  disabled={editingKey !== null}
                  className="edit-btn"
                />
              </Tooltip>
            )}

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
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        className="admin-tabs"
        items={[
          {
            key: 'oposiciones',
            label: 'Gestión de Oposiciones',
            children: (
              <>
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
                      {!isProfesor && (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setAddOposicionModal(true)}
                        >
                          Nueva Oposición
                        </Button>
                      )}
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
                      showSearch
                      optionFilterProp="label"
                      placeholder="Provincia"
                      value={filterProvincia}
                      onChange={(value) => { setFilterProvincia(value); setCurrentPage(1); }}
                      className="filter-select-sm"
                      allowClear
                      options={provincias.map(p => ({ value: p.id, label: p.nombre }))}
                      optionRender={renderCatalogoOption('provincia')}
                      // @ts-ignore
                      dropdownRender={(menu: React.ReactNode) => (
                        <>
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <Button type="text" icon={<PlusOutlined />} onClick={() => { setNewItemName(''); setAddProvinciaModal(true); }} className="add-option-btn" style={{ width: '100%', textAlign: 'left' }}>Agregar</Button>
                        </>
                      )}
                    />

                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Municipio"
                      value={filterMunicipio}
                      onChange={(value) => { setFilterMunicipio(value); setCurrentPage(1); }}
                      className="filter-select-sm"
                      allowClear
                      options={municipios.map(m => ({ value: m.id, label: m.nombre }))}
                      optionRender={renderCatalogoOption('municipio')}
                      // @ts-ignore
                      dropdownRender={(menu: React.ReactNode) => (
                        <>
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <Button type="text" icon={<PlusOutlined />} onClick={() => { setNewItemName(''); setAddMunicipioModal(true); }} className="add-option-btn" style={{ width: '100%', textAlign: 'left' }}>Agregar</Button>
                        </>
                      )}
                    />

                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Categoría"
                      value={filterCategoria}
                      onChange={(value) => { setFilterCategoria(value); setCurrentPage(1); }}
                      className="filter-select-sm"
                      allowClear
                      options={categorias.map(c => ({ value: c.id, label: c.nombre }))}
                      optionRender={renderCatalogoOption('categoria')}
                      // @ts-ignore
                      dropdownRender={(menu: React.ReactNode) => (
                        <>
                          {menu}
                          <Divider style={{ margin: '8px 0' }} />
                          <Button type="text" icon={<PlusOutlined />} onClick={() => { setNewItemName(''); setAddCategoriaModal(true); }} className="add-option-btn" style={{ width: '100%', textAlign: 'left' }}>Agregar</Button>
                        </>
                      )}
                    />

                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Estado"
                      value={filterEstado}
                      onChange={(value) => { setFilterEstado(value); setCurrentPage(1); }}
                      className="filter-select-sm"
                      allowClear
                      options={ESTADOS_OPOSICION.map(e => ({ value: e, label: e }))}
                    />

                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Tipo"
                      value={filterTipo}
                      onChange={(value) => { setFilterTipo(value); setCurrentPage(1); }}
                      className="filter-select-sm"
                      allowClear
                      options={TIPOS_OPOSICION.map(t => ({ value: t, label: t }))}
                    />

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
                  <ConfigProvider
                    theme={{
                      algorithm: theme.defaultAlgorithm,
                      token: { colorBgContainer: '#ffffff', colorText: '#1a2332', colorTextPlaceholder: '#9ca3af', colorBorder: '#d1d5db', colorPrimary: '#23C27B' },
                      components: {
                        Input: { colorBgContainer: '#ffffff', colorText: '#1a2332' },
                        Select: { colorBgContainer: '#ffffff', optionSelectedBg: 'rgba(91, 228, 235, 0.15)' },
                      },
                    }}
                  >
                    <Form
                      form={recursoForm}
                      layout="vertical"
                      onFinish={handleAddRecurso}
                      className="modal-form-light"
                    >
                      {recursoType !== 'relacion' && (
                        <Form.Item
                          name="titulo"
                          label="Título del Recurso"
                          rules={[{ required: true, message: 'Ingrese el título del recurso' }]}
                        >
                          <Input placeholder="Ej: Temario oficial 2024" style={{ background: '#fff', color: '#1a2332' }} />
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
                          <Radio.Button value="file">
                            <UploadOutlined /> Subir Archivo
                          </Radio.Button>
                          <Radio.Button value="url">
                            <LinkOutlined /> Enlace URL
                          </Radio.Button>
                          <Radio.Button value="relacion">
                            <FileTextOutlined /> Relación de Temario
                          </Radio.Button>
                        </Radio.Group>
                      </Form.Item>

                      {recursoType === 'relacion' ? (
                        <Form.Item label="Archivo PDF">
                          <Upload
                            beforeUpload={() => false}
                            fileList={fileList}
                            onChange={({ fileList }) => setFileList(fileList)}
                            accept=".pdf"
                            maxCount={1}
                          >
                            <Button icon={<UploadOutlined />}>Seleccionar PDF</Button>
                          </Upload>
                          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                            Solo se aceptan archivos PDF.
                          </Text>
                        </Form.Item>
                      ) : recursoType === 'file' ? (
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
                          <Input placeholder="https://ejemplo.com/recurso.pdf" style={{ background: '#fff', color: '#1a2332' }} />
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
                            {recursoType === 'relacion' ? 'Cargar la relación de temario' : 'Agregar Recurso'}
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </ConfigProvider>
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
                  <ConfigProvider
                    theme={{
                      algorithm: theme.defaultAlgorithm,
                      token: {
                        colorBgContainer: '#ffffff',
                        colorText: '#1a2332',
                        colorTextPlaceholder: '#9ca3af',
                        colorBorder: '#d1d5db',
                        colorPrimary: '#23C27B',
                      },
                      components: {
                        Input: { colorBgContainer: '#ffffff', colorText: '#1a2332' },
                        Select: { colorBgContainer: '#ffffff', optionSelectedBg: 'rgba(91, 228, 235, 0.15)' },
                        DatePicker: { colorBgContainer: '#ffffff' },
                        InputNumber: { colorBgContainer: '#ffffff' },
                      },
                    }}
                  >
                    <Form
                      form={createForm}
                      layout="vertical"
                      onFinish={handleCreateOposicion}
                      className="modal-form-light"
                      initialValues={{ tipo: 'Oferta' }}
                    >
                      <Form.Item
                        name="provincia_id"
                        label="Provincia"
                        rules={[{ required: true, message: 'Seleccione una provincia' }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          placeholder="Seleccionar provincia"
                          options={provincias.map(p => ({ value: p.id, label: p.nombre }))}
                        />
                      </Form.Item>

                      <Form.Item name="municipio_id" label="Municipio">
                        <Select
                          showSearch
                          allowClear
                          optionFilterProp="label"
                          placeholder="Seleccionar municipio"
                          options={municipios.map(m => ({ value: m.id, label: m.nombre }))}
                        />
                      </Form.Item>

                      <Form.Item
                        name="categoria_id"
                        label="Categoría"
                        rules={[{ required: true, message: 'Seleccione una categoría' }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          placeholder="Seleccionar categoría"
                          options={categorias.map(c => ({ value: c.id, label: c.nombre }))}
                        />
                      </Form.Item>

                      <Form.Item
                        name="convocante"
                        label="Convocante"
                        rules={[{ required: true, message: 'Ingrese el convocante' }]}
                      >
                        <Input placeholder="Ej: Ayuntamiento de Madrid" style={{ background: '#fff', color: '#1a2332' }} />
                      </Form.Item>

                      <Form.Item
                        name="ccaa"
                        label="CCAA"
                      >
                        <Input placeholder="Comunidad Autónoma" style={{ background: '#fff', color: '#1a2332' }} />
                      </Form.Item>

                      <Form.Item
                        name="num_plazas"
                        label="Número de Plazas"
                        rules={[{ required: true, message: 'Ingrese el número de plazas' }]}
                      >
                        <InputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>

                      <Form.Item
                        name="url_bases_oficiales"
                        label="URL de bases oficiales"
                        rules={[
                          { required: true, message: 'Ingrese la URL' },
                          { type: 'url', message: 'Ingrese una URL válida' }
                        ]}
                      >
                        <Input placeholder="https://..." style={{ background: '#fff', color: '#1a2332' }} />
                      </Form.Item>

                      <Form.Item
                        name="url_convocatoria"
                        label="URL Convocatoria"
                        rules={[
                          { type: 'url', message: 'Ingrese una URL válida' }
                        ]}
                      >
                        <Input placeholder="https://..." style={{ background: '#fff', color: '#1a2332' }} />
                      </Form.Item>

                      <Form.Item
                        name="tipo"
                        label="Tipo"
                        rules={[{ required: true, message: 'Seleccione el tipo' }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          options={TIPOS_OPOSICION.map(t => ({ value: t, label: t }))}
                          onChange={(val) => {
                            if (val === 'Convocatoria') {
                              const url = createForm.getFieldValue('url_bases_oficiales');
                              if (!url || url.trim() === '') {
                                notify.warning('Para ser una Convocatoria debe tener la URL de bases oficiales, ya que activa la solicitud de temario. Se ha revertido a Oferta.');
                                createForm.setFieldValue('tipo', 'Oferta');
                              }
                            }
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        name="estado"
                        label="Estado"
                        rules={[{ required: true, message: 'Seleccione el estado' }]}
                      >
                        <Select showSearch optionFilterProp="label" options={ESTADOS_OPOSICION.map(e => ({ value: e, label: e }))} />
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
                        name="compania"
                        label="Línea"
                      >
                        <Select
                          placeholder="Seleccionar línea"
                          allowClear
                          options={[
                            { value: 'Supera', label: 'Supera' },
                            { value: 'Patrio', label: 'Patrio' },
                            { value: 'Otro', label: 'Otro' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item
                        name="observaciones"
                        label="Observaciones"
                      >
                        <TextArea rows={3} placeholder="Observaciones adicionales..." style={{ background: '#fff', color: '#1a2332' }} />
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
                  </ConfigProvider>
                </Modal>

                {/* Modales de provincia, municipio y categoría (sin cambios) */}
                {/* Modal ver recursos */}
                <Modal
                  title={`Recursos — ${recursoViewTitulo}`}
                  open={recursoViewModal}
                  onCancel={() => { setRecursoViewModal(false); setRecursoViewList([]); }}
                  footer={null}
                  width={700}
                  className="admin-modal"
                >
                  {recursoViewLoading ? (
                    <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
                  ) : recursoViewList.length === 0 ? (
                    <Text style={{ color: '#64748b' }}>No hay recursos para esta oposición.</Text>
                  ) : (
                    <Table
                      dataSource={recursoViewList}
                      rowKey={(r) => String(r.id ?? r.titulo)}
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: 'Título',
                          dataIndex: 'titulo',
                          key: 'titulo',
                          ellipsis: true,
                        },
                        {
                          title: 'Tipo',
                          dataIndex: 'tipo',
                          key: 'tipo',
                          width: 100,
                          render: (tipo) => <Tag>{tipo}</Tag>,
                        },
                        {
                          title: 'Enlace',
                          dataIndex: 'url',
                          key: 'url',
                          width: 90,
                          render: (url) => url ? (
                            <Button type="link" icon={<LinkOutlined />} href={url} target="_blank" size="small">
                              Abrir
                            </Button>
                          ) : '—',
                        },
                        {
                          title: '',
                          key: 'delete',
                          width: 48,
                          render: (_, recurso) => {
                            const titulo = (recurso.titulo ?? '').toLowerCase();
                            const esRelacion = titulo.includes('relaci') && titulo.includes('temario');
                            return esRelacion ? (
                              <Tooltip title="Reemplazar relación de temario">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<SwapOutlined style={{ color: '#d97706' }} />}
                                  onClick={() => handleDeleteRecurso(recurso)}
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Eliminar recurso">
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteRecurso(recurso)}
                                />
                              </Tooltip>
                            );
                          },
                        },
                      ]}
                    />
                  )}
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
                  width={480}
                  className="admin-modal"
                >
                  <p style={{ color: '#4a5568', marginBottom: 8 }}>
                    La <strong>Relación de Temario</strong> es un recurso estructural del sistema. Eliminarlo directamente rompería el flujo de generación de temarios.
                  </p>
                  <p style={{ color: '#4a5568' }}>
                    Para actualizarlo, debés <strong>reemplazarlo</strong> subiendo un nuevo archivo PDF. Hacé clic en <em>"Ir a reemplazar archivo"</em> para continuar.
                  </p>
                </Modal>

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
                        style={{ background: '#fff', color: '#1a2332', borderColor: '#d9d9d9' }}
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
                        style={{ background: '#fff', color: '#1a2332', borderColor: '#d9d9d9' }}
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
                        style={{ background: '#fff', color: '#1a2332', borderColor: '#d9d9d9' }}
                      />
                    </Form.Item>
                  </Form>
                </Modal>

                {/* Modal reasignar y borrar catálogo en uso */}
                <Modal
                  open={!!reassignModal}
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d97706' }}>
                      <WarningOutlined /> "{reassignModal?.nombre}" está en uso
                    </span>
                  }
                  onCancel={() => { setReassignModal(null); setReassignTo(undefined); }}
                  onOk={confirmarReasignarYBorrar}
                  okText="Reasignar y eliminar"
                  okButtonProps={{ danger: true, disabled: reassignTo == null }}
                  cancelText="Cancelar"
                  confirmLoading={deletingCatalog}
                  className="admin-modal"
                  width={520}
                >
                  <ConfigProvider
                    theme={{
                      algorithm: theme.defaultAlgorithm,
                      token: { colorBgContainer: '#ffffff', colorText: '#1a2332', colorTextPlaceholder: '#9ca3af', colorBorder: '#d1d5db', colorPrimary: '#23C27B' },
                      components: { Select: { colorBgContainer: '#ffffff', optionSelectedBg: 'rgba(35, 194, 123, 0.15)' } },
                    }}
                  >
                    {reassignModal && (
                      <p style={{ color: '#4a5568', marginBottom: 12 }}>
                        Esta {CATALOGO_LABEL[reassignModal.tipo]} está asignada a <strong>{reassignModal.enUso}</strong> oposición(es).
                        No se puede borrar mientras esté en uso. Estas son las oposiciones afectadas:
                      </p>
                    )}
                    {reassignModal && reassignModal.oposiciones.length > 0 && (
                      <div
                        style={{
                          maxHeight: 180,
                          overflowY: 'auto',
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          padding: '8px 12px',
                          marginBottom: 14,
                          background: '#f8fafc',
                        }}
                      >
                        {reassignModal.oposiciones.map((o) => (
                          <div
                            key={o.id}
                            style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0', color: '#1a2332', fontSize: 13 }}
                          >
                            <Text type="secondary" style={{ fontSize: 12 }}>#{o.id}</Text>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.titulo}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ color: '#4a5568', marginBottom: 8 }}>
                      Elegí con qué valor reemplazarla. Esas oposiciones pasarán a usar el nuevo valor y luego se eliminará
                      {reassignModal ? ` "${reassignModal.nombre}"` : ''}:
                    </p>
                    <Select
                      style={{ width: '100%' }}
                      showSearch
                      optionFilterProp="label"
                      placeholder="Reemplazar por..."
                      value={reassignTo}
                      onChange={(v) => setReassignTo(v)}
                      options={opcionesReasignacion}
                    />
                  </ConfigProvider>
                </Modal>

                {/* Modal ver solicitantes del temario */}
                <Modal
                  title={`Solicitantes del temario — ${solicitantesModal?.titulo ?? ''}`}
                  open={!!solicitantesModal}
                  onCancel={() => setSolicitantesModal(null)}
                  footer={null}
                  width={560}
                  className="admin-modal"
                >
                  <ConfigProvider
                    theme={{
                      algorithm: theme.defaultAlgorithm,
                      token: { colorBgContainer: '#ffffff', colorText: '#1a2332', colorTextSecondary: '#5a6678', colorBorder: '#d1d5db', colorPrimary: '#23C27B' },
                    }}
                  >
                    {solicitantesLoading ? (
                      <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
                    ) : solicitantes.length === 0 ? (
                      <Text style={{ color: '#64748b' }}>Todavía no hay estudiantes que hayan solicitado este temario.</Text>
                    ) : (
                      <>
                        <Text style={{ color: '#4a5568', display: 'block', marginBottom: 10 }}>
                          {solicitantes.length} estudiante(s) solicitaron el temario:
                        </Text>
                        <Table
                          dataSource={solicitantes}
                          rowKey="num"
                          pagination={false}
                          size="small"
                          scroll={{ y: 320 }}
                          columns={[
                            { title: '#', dataIndex: 'num', key: 'num', width: 50 },
                            { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
                            ...(isAdmin
                              ? [{
                                  title: '',
                                  key: 'ver',
                                  width: 140,
                                  render: (_: any, row: { email: string }) => (
                                    <Button
                                      type="link"
                                      size="small"
                                      icon={<UserOutlined />}
                                      onClick={() => verUsuarioEnGestion(row.email)}
                                    >
                                      Ver usuario
                                    </Button>
                                  ),
                                }]
                              : []),
                          ]}
                        />
                      </>
                    )}
                  </ConfigProvider>
                </Modal>

              </>
            ),
          },
          ...(!isProfesor
            ? [
                {
                  key: 'usuarios',
                  label: 'Gestión de Usuarios',
                  children: <AdminUsuarios onGestionarOposicion={handleGestionarOposicion} searchOverride={usuariosSearch} />,
                },
                {
                  key: 'historico',
                  label: 'Histórico de Revisiones',
                  children: <AdminHistorico />,
                },
                {
                  key: 'actividades',
                  label: 'Actividades',
                  children: <AdminActividades />,
                },
              ]
            : []),
        ]}
      />
    </motion.div>
  );
};

export default AdminOposiciones;