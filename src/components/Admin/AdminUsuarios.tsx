import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Select,
  Space,
  Card,
  Typography,
  Tag,
  Spin,
  Button,
  Modal,
  Form,
  ConfigProvider,
  theme,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
  UserAddOutlined,
  KeyOutlined,
  LockOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usuariosService, UsuarioAdmin, CrearUsuarioPayload, ActualizarUsuarioPayload } from '../../services/usuariosService';
import { notify } from '@/utils/notify';

// Tema claro para los modales (la app va en oscuro y el Modal heredaría ilegible)
const LIGHT_MODAL = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorBgContainer: '#ffffff',
    colorText: '#1a2332',
    colorTextSecondary: '#5a6678',
    colorBorder: '#d1d5db',
    colorPrimary: '#23C27B',
  },
};

const { Text, Title } = Typography;
const { Option } = Select;

const ROL_COLOR: Record<string, string> = {
  estudiante: 'blue',
  ESTUDIANTE: 'blue',
  alumno: 'blue',
  ALUMNO: 'blue',
  profesor: 'green',
  PROFESOR: 'green',
  administrador: 'red',
  ADMINISTRADOR: 'red',
};

interface AdminUsuariosProps {
  onGestionarOposicion?: (nombre: string) => void;
  // Búsqueda impuesta desde afuera (ej: "ver este solicitante en Usuarios")
  searchOverride?: string;
}

const AdminUsuarios: React.FC<AdminUsuariosProps> = ({ onGestionarOposicion, searchOverride }) => {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterRol, setFilterRol] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [expandedKeys, setExpandedKeys] = useState<number[]>([]);

  // Crear usuario
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const rolSeleccionado = Form.useWatch('rol', createForm);
  // Cambiar contraseña
  const [pwdTarget, setPwdTarget] = useState<UsuarioAdmin | null>(null);
  const [pwdForm] = Form.useForm();
  // Editar usuario (solo los creados en OpoRadar)
  const [editTarget, setEditTarget] = useState<UsuarioAdmin | null>(null);
  const [editForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await usuariosService.getUsuarios({
        search: searchText || undefined,
        rol: filterRol,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
      setUsuarios(result.data);
      setTotal(result.total);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 300);
    return () => clearTimeout(timer);
  }, [searchText, filterRol, currentPage, pageSize]);

  // Cuando el padre impone una búsqueda (ej: al saltar desde "Solicitantes"),
  // la aplicamos en el buscador de usuarios.
  useEffect(() => {
    if (searchOverride) {
      setSearchText(searchOverride);
      setCurrentPage(1);
    }
  }, [searchOverride]);

  const handleCrear = async (values: CrearUsuarioPayload) => {
    setSaving(true);
    try {
      const esProfesor = values.rol === 'PROFESOR';
      await usuariosService.crearUsuario({
        email: values.email.trim(),
        nombre: values.nombre.trim(),
        password: values.password,
        rol: values.rol,
        especialidad: esProfesor ? values.especialidad?.trim() : undefined,
        // La línea del profesor es su especialidad; la del alumno, la elegida.
        company_organization: esProfesor ? values.especialidad?.trim() : values.company_organization,
        dni: values.dni?.trim(),
      });
      notify.success('Usuario creado correctamente');
      setCreateOpen(false);
      createForm.resetFields();
      loadData();
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'No se pudo crear el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarPassword = async (values: { password: string }) => {
    if (!pwdTarget) return;
    setSaving(true);
    try {
      await usuariosService.cambiarPassword(pwdTarget.id, values.password);
      notify.success(`Contraseña actualizada para ${pwdTarget.nombre}`);
      setPwdTarget(null);
      pwdForm.resetFields();
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'No se pudo cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  // Abrir el modal de edición pre-cargado.
  const abrirEdicion = (record: UsuarioAdmin) => {
    const esProfesor = (record.rol || '').toUpperCase() === 'PROFESOR';
    const lineaRaw = (record.company_organization || '').trim();
    setEditTarget(record);
    editForm.setFieldsValue({
      nombre: record.nombre,
      email: record.email,
      dni: record.dni || '',
      // Profesor: valores 'Supera'/'Patrio'; alumno: 'supera'/'patrio'.
      linea: lineaRaw
        ? (esProfesor
            ? lineaRaw.charAt(0).toUpperCase() + lineaRaw.slice(1).toLowerCase()
            : lineaRaw.toLowerCase())
        : undefined,
    });
  };

  const handleEditar = async (values: { nombre: string; email: string; dni?: string; linea?: string }) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const esProfesor = (editTarget.rol || '').toUpperCase() === 'PROFESOR';
      const payload: ActualizarUsuarioPayload = {
        usuario_id: editTarget.id,
        nombre: values.nombre?.trim(),
        email: values.email?.trim(),
        dni: values.dni?.trim(),
        company_organization: values.linea,
        especialidad: esProfesor ? values.linea : undefined,
      };
      const res = await usuariosService.actualizarUsuario(payload);
      if (res?.success) {
        notify.success(`Usuario "${payload.nombre || editTarget.nombre}" actualizado`);
        setEditTarget(null);
        editForm.resetFields();
        loadData();
      } else {
        notify.warning(res?.message || 'No se pudo actualizar el usuario');
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'No se pudo actualizar el usuario');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar usuario (solo los creados en OpoRadar: pertenece_app = true).
  const handleEliminar = async (record: UsuarioAdmin) => {
    try {
      const res = await usuariosService.eliminarUsuario(record.id);
      if (res?.success) {
        notify.success(`Usuario "${record.nombre}" eliminado`);
        loadData();
      } else {
        notify.warning(res?.message || 'No se pudo eliminar el usuario');
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'No se pudo eliminar el usuario');
    }
  };

  const columns: ColumnsType<UsuarioAdmin> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: 180,
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: 'Rol',
      dataIndex: 'rol',
      key: 'rol',
      width: 130,
      render: (rol) => (
        <Tag color={ROL_COLOR[rol] || 'default'}>{rol}</Tag>
      ),
    },
    {
      title: 'Oposiciones',
      key: 'oposiciones',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const count = Object.keys(record.oposiciones || {}).length;
        return (
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() =>
              setExpandedKeys((prev) =>
                prev.includes(record.id)
                  ? prev.filter((k) => k !== record.id)
                  : [...prev, record.id]
              )
            }
          >
            {count} oposición{count !== 1 ? 'es' : ''}
          </Button>
        );
      },
    },
    {
      title: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Acciones
          <Tooltip
            title={
              <div style={{ maxWidth: 300, fontSize: 12.5, lineHeight: 1.5 }}>
                <div style={{ marginBottom: 6 }}>
                  <strong>Contraseña:</strong> profesores, administradores y usuarios creados en
                  OpoRadar. Los alumnos que vienen de la plataforma externa se autentican allí, así
                  que su contraseña no se gestiona en OpoRadar.
                </div>
                <div>
                  <strong>Eliminar:</strong> solo usuarios creados en OpoRadar. Los importados desde
                  la plataforma externa no se pueden borrar (se recrearían al iniciar sesión).
                </div>
              </div>
            }
          >
            <InfoCircleOutlined style={{ color: '#94a3b8', cursor: 'help', fontSize: 13 }} />
          </Tooltip>
        </span>
      ),
      key: 'acciones',
      width: 240,
      render: (_, record) => {
        // Los alumnos inician sesión con SuperaBusca (auth externa): su contraseña
        // no se gestiona en nuestra DB, así que no se puede cambiar desde aquí.
        const rol = (record.rol || '').toUpperCase();
        const esAlumno = rol === 'ALUMNO' || rol === 'ESTUDIANTE';

        const lineaRaw = (record.company_organization || '').trim();
        const linea = lineaRaw
          ? lineaRaw.charAt(0).toUpperCase() + lineaRaw.slice(1).toLowerCase()
          : 'Sin línea';

        // La contraseña se gestiona en OpoRadar para profes/admin y para cualquier
        // usuario creado en la plataforma. Solo los alumnos que vienen de la
        // plataforma externa (pertenece_app=false) se autentican allí.
        const gestionaPasswordAqui = !esAlumno || !!record.pertenece_app;

        const passwordControl = gestionaPasswordAqui ? (
          <Tooltip title="Cambiar la contraseña de este usuario">
            <Button
              type="text"
              icon={<KeyOutlined />}
              size="small"
              className="edit-btn"
              onClick={() => { setPwdTarget(record); pwdForm.resetFields(); }}
            >
              Contraseña
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="La contraseña de los alumnos se gestiona en su plataforma de acceso externa, no en OpoRadar.">
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 11px', borderRadius: 999,
                background: 'rgba(148,163,184,0.14)',
                border: '1px solid rgba(148,163,184,0.22)',
                color: '#94a3b8', fontSize: 12, fontWeight: 500,
                cursor: 'default', whiteSpace: 'nowrap',
              }}
            >
              <LockOutlined style={{ fontSize: 11 }} /> {linea}
            </span>
          </Tooltip>
        );

        return (
          <Space size={8} align="center">
            {passwordControl}
            {/* Editar y eliminar: solo para los usuarios creados en OpoRadar */}
            {record.pertenece_app && (
              <>
                <Tooltip title="Editar usuario">
                  <Button
                    type="text"
                    size="small"
                    shape="circle"
                    className="edit-btn"
                    icon={<EditOutlined />}
                    onClick={() => abrirEdicion(record)}
                  />
                </Tooltip>
                <Popconfirm
                  title="Eliminar usuario"
                  description={`¿Eliminar a "${record.nombre}"? No se puede deshacer.`}
                  okText="Eliminar"
                  cancelText="Cancelar"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleEliminar(record)}
                >
                  <Tooltip title="Eliminar usuario (creado en OpoRadar)">
                    <Button type="text" danger size="small" shape="circle" icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  const expandedRowRender = (record: UsuarioAdmin) => {
    const oposiciones = Object.entries(record.oposiciones || {});
    if (!oposiciones.length) {
      return <Text type="secondary" style={{ padding: '8px 16px', display: 'block' }}>Sin oposiciones asignadas</Text>;
    }

    const opCols = [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 80,
        render: (v: string) => <Text type="secondary">#{v}</Text>,
      },
      {
        title: 'Nombre',
        dataIndex: 'nombre',
        key: 'nombre',
        render: (v: string) => <Text>{v}</Text>,
      },
      {
        title: 'Acción',
        key: 'accion',
        width: 180,
        render: (_: unknown, row: { id: string; nombre: string }) => (
          <Button
            type="text"
            icon={<EyeOutlined />}
            className="edit-btn"
            onClick={() => onGestionarOposicion?.(row.nombre)}
          >
            Gestionar oposición
          </Button>
        ),
      },
    ];

    const data = oposiciones.map(([id, nombre]) => ({ id, nombre }));

    return (
      <Table
        columns={opCols}
        dataSource={data}
        rowKey="id"
        pagination={false}
        size="small"
        style={{ margin: '0 16px 8px' }}
      />
    );
  };

  return (
    <div>
      <div className="admin-header">
        <div className="header-content">
          <Title level={2} className="admin-title">
            Gestión de Usuarios
          </Title>
          <Text type="secondary" className="admin-subtitle">
            Consulta y gestiona los usuarios del sistema
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
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              Recargar
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => { createForm.resetFields(); setCreateOpen(true); }}
            >
              Crear usuario
            </Button>
          </Space>
        </div>
        <div className="filters-content">
          <Input
            placeholder="Buscar por nombre o email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
            allowClear
            className="search-input"
          />
          <Select
            placeholder="Rol"
            value={filterRol}
            onChange={(v) => { setFilterRol(v); setCurrentPage(1); }}
            allowClear
            className="filter-select-sm"
          >
            <Option value="ALUMNO">Alumno</Option>
            <Option value="PROFESOR">Profesor</Option>
            <Option value="ADMINISTRADOR">Administrador</Option>
          </Select>
        </div>
      </Card>

      <Card className="table-card">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip="Cargando usuarios..." />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={usuarios}
            rowKey="id"
            expandable={{
              expandedRowRender,
              expandedRowKeys: expandedKeys,
              showExpandColumn: false,
            }}
            pagination={{
              current: currentPage,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (t, range) => (
                <Text type="secondary">
                  {range[0]}-{range[1]} de {t} registros
                </Text>
              ),
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              },
            }}
            className="admin-table"
            size="middle"
          />
        )}
      </Card>

      <ConfigProvider theme={LIGHT_MODAL}>
        {/* Crear usuario */}
        <Modal
          title="Crear usuario"
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          onOk={() => createForm.submit()}
          okText="Crear"
          cancelText="Cancelar"
          confirmLoading={saving}
          width={520}
          destroyOnClose
        >
          <Form form={createForm} layout="vertical" onFinish={handleCrear} style={{ marginTop: 8 }} initialValues={{ rol: 'ALUMNO' }}>
            <Form.Item
              name="nombre"
              label="Nombre"
              rules={[{ required: true, message: 'El nombre es obligatorio' }]}
            >
              <Input placeholder="Nombre completo" maxLength={150} />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'El email es obligatorio' },
                { type: 'email', message: 'Email no válido' },
              ]}
            >
              <Input placeholder="correo@ejemplo.com" />
            </Form.Item>
            <Form.Item
              name="dni"
              label="DNI"
              rules={[{ required: true, message: 'El DNI es obligatorio' }]}
            >
              <Input placeholder="Número de DNI" maxLength={50} />
            </Form.Item>
            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                { required: true, message: 'La contraseña es obligatoria' },
                { min: 8, message: 'Mínimo 8 caracteres' },
              ]}
            >
              <Input.Password placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="rol"
              label="Rol"
              rules={[{ required: true, message: 'Selecciona un rol' }]}
            >
              {/* Solo ALUMNO/PROFESOR. ADMINISTRADOR es exclusivo de desarrollo. */}
              <Select
                options={[
                  { value: 'ALUMNO', label: 'Alumno' },
                  { value: 'PROFESOR', label: 'Profesor' },
                ]}
              />
            </Form.Item>
            {rolSeleccionado === 'PROFESOR' && (
              <Form.Item
                name="especialidad"
                label="Especialidad (línea a la que se dirige)"
                rules={[{ required: true, message: 'Indica si el profesor va a Supera o Patrio' }]}
              >
                <Select
                  placeholder="¿Supera o Patrio?"
                  options={[
                    { value: 'Supera', label: 'Supera' },
                    { value: 'Patrio', label: 'Patrio' },
                  ]}
                />
              </Form.Item>
            )}
            {rolSeleccionado !== 'PROFESOR' && (
              <Form.Item
                name="company_organization"
                label="Línea"
                rules={[{ required: true, message: 'Elige la línea del alumno' }]}
              >
                <Select
                  placeholder="¿Supera o Patrio?"
                  options={[
                    { value: 'supera', label: 'Supera' },
                    { value: 'patrio', label: 'Patrio' },
                  ]}
                />
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* Cambiar contraseña */}
        <Modal
          title={pwdTarget ? `Cambiar contraseña — ${pwdTarget.nombre}` : 'Cambiar contraseña'}
          open={!!pwdTarget}
          onCancel={() => setPwdTarget(null)}
          onOk={() => pwdForm.submit()}
          okText="Actualizar"
          cancelText="Cancelar"
          confirmLoading={saving}
          width={460}
          destroyOnClose
        >
          <Form form={pwdForm} layout="vertical" onFinish={handleCambiarPassword} style={{ marginTop: 8 }}>
            <Form.Item
              name="password"
              label="Nueva contraseña"
              rules={[
                { required: true, message: 'Ingresa la nueva contraseña' },
                { min: 8, message: 'Mínimo 8 caracteres' },
              ]}
            >
              <Input.Password placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Editar usuario (solo los creados en OpoRadar) */}
        <Modal
          title={editTarget ? `Editar usuario — ${editTarget.nombre}` : 'Editar usuario'}
          open={!!editTarget}
          onCancel={() => setEditTarget(null)}
          onOk={() => editForm.submit()}
          okText="Guardar"
          cancelText="Cancelar"
          confirmLoading={saving}
          width={520}
          destroyOnClose
        >
          <Form form={editForm} layout="vertical" onFinish={handleEditar} style={{ marginTop: 8 }}>
            {editTarget && (
              <div style={{ marginBottom: 12 }}>
                <Tag color={ROL_COLOR[editTarget.rol] || 'default'}>{editTarget.rol}</Tag>
                <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>
                  El rol no se puede cambiar desde aquí
                </span>
              </div>
            )}
            <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'El nombre es obligatorio' }]}>
              <Input placeholder="Nombre completo" maxLength={150} />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'El email es obligatorio' },
                { type: 'email', message: 'Email no válido' },
              ]}
            >
              <Input placeholder="correo@ejemplo.com" />
            </Form.Item>
            <Form.Item name="dni" label="DNI" rules={[{ required: true, message: 'El DNI es obligatorio' }]}>
              <Input placeholder="Número de DNI" maxLength={50} />
            </Form.Item>
            <Form.Item
              name="linea"
              label={(editTarget?.rol || '').toUpperCase() === 'PROFESOR' ? 'Especialidad (línea)' : 'Línea'}
              rules={[{ required: true, message: 'Elige la línea' }]}
            >
              <Select
                placeholder="¿Supera o Patrio?"
                options={
                  (editTarget?.rol || '').toUpperCase() === 'PROFESOR'
                    ? [{ value: 'Supera', label: 'Supera' }, { value: 'Patrio', label: 'Patrio' }]
                    : [{ value: 'supera', label: 'Supera' }, { value: 'patrio', label: 'Patrio' }]
                }
              />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default AdminUsuarios;