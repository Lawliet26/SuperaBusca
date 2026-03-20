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
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usuariosService, UsuarioAdmin } from '../../services/usuariosService';

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
    </div>
  );
};

export default AdminUsuarios;