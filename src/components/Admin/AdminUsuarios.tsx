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
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
  UserAddOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usuariosService, UsuarioAdmin, CrearUsuarioPayload } from '../../services/usuariosService';
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
  profesor: 'green',
  PROFESOR: 'green',
  administrador: 'red',
  ADMINISTRADOR: 'red',
};

interface AdminUsuariosProps {
  onGestionarOposicion?: (nombre: string) => void;
}

const AdminUsuarios: React.FC<AdminUsuariosProps> = ({ onGestionarOposicion }) => {
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

  const handleCrear = async (values: CrearUsuarioPayload) => {
    setSaving(true);
    try {
      await usuariosService.crearUsuario({
        email: values.email.trim(),
        nombre: values.nombre.trim(),
        password: values.password,
        rol: values.rol,
        especialidad: values.rol === 'PROFESOR' ? values.especialidad?.trim() : undefined,
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
      title: 'Acciones',
      key: 'acciones',
      width: 160,
      render: (_, record) => (
        <Button
          type="text"
          icon={<KeyOutlined />}
          size="small"
          className="edit-btn"
          onClick={() => { setPwdTarget(record); pwdForm.resetFields(); }}
        >
          Contraseña
        </Button>
      ),
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
            <Option value="ESTUDIANTE">Estudiante</Option>
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
                label="Especialidad"
                rules={[{ required: true, message: 'La especialidad es obligatoria para un profesor' }]}
              >
                <Input placeholder="Ej: Derecho Administrativo" maxLength={150} />
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
                { required: true, message: 'Ingresá la nueva contraseña' },
                { min: 8, message: 'Mínimo 8 caracteres' },
              ]}
            >
              <Input.Password placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default AdminUsuarios;