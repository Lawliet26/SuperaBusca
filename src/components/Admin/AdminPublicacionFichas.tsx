import React, { useEffect, useMemo, useState } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, Modal, Form, InputNumber, Switch,
  Typography, Card, Spin, Tooltip, Segmented, Alert, Popconfirm, Descriptions, Empty,
  ConfigProvider, theme, Row, Col,
} from 'antd';
import {
  ReloadOutlined, SearchOutlined, FilterOutlined, CheckCircleOutlined,
  WarningOutlined, LinkOutlined, CloudUploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { notify } from '@/utils/notify';
import {
  fichasPublicacionService,
  FichaPublicacion,
  CandidatoConciliacion,
  SituacionFicha,
  OrigenTabla,
  EnlaceFicha,
} from '../../services/fichasPublicacionService';
import { provinciasService, Provincia } from '../../services/provinciasService';
import { municipiosService, Municipio } from '../../services/municipiosService';
import { categoriasService, Categoria } from '../../services/categoriasService';
import './AdminOposiciones.css';

const { Title, Text } = Typography;

const COMPANIAS = ['Supera', 'Patrio'];
const ESTADOS_CATALOGO = ['Abierta', 'Cerrada'];

const SITUACION_INFO: Record<SituacionFicha, { label: string; color: string }> = {
  lista: { label: 'Lista para publicar', color: 'green' },
  incompleta: { label: 'Le faltan datos', color: 'orange' },
  publicada: { label: 'Publicada', color: 'blue' },
};

const TABLA_LABEL: Record<OrigenTabla, string> = {
  registro_unico: 'Registro',
  hallazgos_boletines: 'Hallazgos',
};

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const Enlaces: React.FC<{ links: EnlaceFicha[] | null }> = ({ links }) => {
  if (!links || links.length === 0) return <Text type="secondary">Sin enlaces</Text>;
  return (
    <Space orientation="vertical" size={2}>
      {links.map((l) => (
        <a key={l.url + l.texto} href={l.url} target="_blank" rel="noopener noreferrer">
          <LinkOutlined /> {l.texto || l.url}
        </a>
      ))}
    </Space>
  );
};

const AdminPublicacionFichas: React.FC = () => {
  const [vista, setVista] = useState<'fichas' | 'conciliacion'>('fichas');

  // Catálogos para los selects del formulario
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Fichas
  const [fichas, setFichas] = useState<FichaPublicacion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [situacion, setSituacion] = useState<SituacionFicha | undefined>('lista');
  const [origenTabla, setOrigenTabla] = useState<OrigenTabla | undefined>();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modal de revisión
  const [fichaActual, setFichaActual] = useState<FichaPublicacion | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [form] = Form.useForm();

  // Conciliación
  const [candidatos, setCandidatos] = useState<CandidatoConciliacion[]>([]);
  const [loadingConc, setLoadingConc] = useState(false);
  const [vinculando, setVinculando] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      provinciasService.getProvincias(),
      municipiosService.getMunicipios(),
      categoriasService.getCategorias(),
    ])
      .then(([p, m, c]) => { setProvincias(p); setMunicipios(m); setCategorias(c); })
      .catch(() => notify.error('No se pudieron cargar provincias, municipios o categorías'));
  }, []);

  // Búsqueda con debounce para no llamar al backend en cada tecla
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchText.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const loadFichas = async () => {
    setLoading(true);
    try {
      const { data, total } = await fichasPublicacionService.getFichas({
        situacion,
        origen_tabla: origenTabla,
        search: search || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setFichas(data);
      setTotal(total);
    } catch (err) {
      notify.error(errorMessage(err, 'Error al cargar las fichas'));
    } finally {
      setLoading(false);
    }
  };

  const loadConciliacion = async () => {
    setLoadingConc(true);
    try {
      setCandidatos(await fichasPublicacionService.getConciliacion());
    } catch (err) {
      notify.error(errorMessage(err, 'Error al cargar la conciliación'));
    } finally {
      setLoadingConc(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (vista === 'fichas') loadFichas(); }, [vista, situacion, origenTabla, search, page, pageSize]);
  useEffect(() => { if (vista === 'conciliacion') loadConciliacion(); }, [vista]);

  const nombreProvincia = (id: number | null) => provincias.find((p) => p.id === id)?.nombre;
  const nombreCategoria = (id: number | null) => categorias.find((c) => c.id === id)?.nombre;

  // --- Modal ----------------------------------------------------------------

  const abrirRevision = (f: FichaPublicacion) => {
    setFichaActual(f);
    // Si ya hay aprobación, se precargan sus valores; si no, lo que propone la ficha.
    form.setFieldsValue({
      compania: f.aprobacion_compania ?? undefined,
      estado: f.aprobacion_estado ?? f.propuesta_estado ?? undefined,
      num_plazas: f.aprobacion_num_plazas ?? f.propuesta_num_plazas ?? undefined,
      provincia_id: f.aprobacion_provincia_id ?? f.propuesta_provincia_id ?? undefined,
      municipio_id: f.aprobacion_municipio_id ?? f.propuesta_municipio_id ?? undefined,
      categoria_id: f.aprobacion_categoria_id ?? f.propuesta_categoria_id ?? undefined,
      titulo: f.aprobacion_titulo ?? f.propuesta_titulo ?? '',
      sincronizar: f.aprobacion_sincronizar ?? true,
    });
  };

  const cerrarRevision = () => { setFichaActual(null); form.resetFields(); };

  // Solo se manda como override lo que difiere de la propuesta de la ficha:
  // así, si la ficha se corrige más adelante, se vuelve a usar su valor.
  const override = <T,>(valor: T | undefined | null, propuesta: T | null): T | null =>
    valor === undefined || valor === null || valor === propuesta ? null : valor;

  const publicar = async () => {
    if (!fichaActual) return;
    const v = await form.validateFields();
    const f = fichaActual;
    setPublicando(true);
    try {
      const titulo = (v.titulo ?? '').trim();
      const { oposicion_id } = await fichasPublicacionService.publicarFicha({
        origen_tabla: f.origen_tabla,
        origen_id: f.origen_id,
        compania: v.compania,
        estado: override(v.estado, f.propuesta_estado) as 'Abierta' | 'Cerrada' | null,
        num_plazas: override(v.num_plazas, f.propuesta_num_plazas),
        provincia_id: override(v.provincia_id, f.propuesta_provincia_id),
        municipio_id: override(v.municipio_id, f.propuesta_municipio_id),
        categoria_id: override(v.categoria_id, f.propuesta_categoria_id),
        titulo: override(titulo || null, f.propuesta_titulo),
        sincronizar: v.sincronizar,
      });
      notify.success(`Ficha ${f.origen_id} publicada (oposición #${oposicion_id})`);
      cerrarRevision();
      loadFichas();
    } catch (err) {
      // El backend devuelve el motivo exacto (p. ej. posible duplicado o dato que falta)
      notify.error(errorMessage(err, 'No se pudo publicar la ficha'));
    } finally {
      setPublicando(false);
    }
  };

  // --- Tabla de fichas --------------------------------------------------------

  const columnasFichas: ColumnsType<FichaPublicacion> = [
    {
      title: 'Ficha',
      key: 'ficha',
      width: 130,
      render: (_, f) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{f.origen_id}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{TABLA_LABEL[f.origen_tabla]}</Text>
        </Space>
      ),
    },
    {
      title: 'Organismo / categoría',
      key: 'organismo',
      render: (_, f) => (
        <Space orientation="vertical" size={0}>
          <Text>{f.organismo || '—'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{f.cuerpo_categoria}</Text>
        </Space>
      ),
    },
    {
      title: 'Provincia',
      dataIndex: 'provincia',
      key: 'provincia',
      width: 140,
      render: (v) => v || '—',
    },
    {
      title: 'Estado ficha',
      dataIndex: 'estado_ficha',
      key: 'estado_ficha',
      width: 130,
      render: (v) => <Tag>{v || '—'}</Tag>,
    },
    {
      title: 'Plazas',
      dataIndex: 'plazas_ficha',
      key: 'plazas_ficha',
      width: 80,
      render: (v) => v || '—',
    },
    {
      title: 'Situación',
      key: 'situacion',
      width: 190,
      render: (_, f) => {
        const info = SITUACION_INFO[f.situacion];
        const tag = <Tag color={info.color}>{info.label}</Tag>;
        if (f.situacion === 'incompleta' && f.problemas.length > 0) {
          return (
            <Tooltip title={<ul style={{ margin: 0, paddingLeft: 16 }}>{f.problemas.map((p) => <li key={p}>{p}</li>)}</ul>}>
              {tag}
            </Tooltip>
          );
        }
        if (f.situacion === 'publicada' && f.oposicion_id) {
          return <Space size={4}>{tag}<Text type="secondary">#{f.oposicion_id}</Text></Space>;
        }
        return tag;
      },
    },
    {
      title: '',
      key: 'acciones',
      width: 140,
      render: (_, f) => (
        <Button type={f.situacion === 'lista' ? 'primary' : 'default'} onClick={() => abrirRevision(f)}>
          {f.situacion === 'publicada' ? 'Ver / actualizar' : 'Revisar'}
        </Button>
      ),
    },
  ];

  // --- Tabla de conciliación --------------------------------------------------

  const columnasConciliacion: ColumnsType<CandidatoConciliacion> = [
    {
      title: 'Oposición del catálogo',
      key: 'oposicion',
      render: (_, c) => (
        <Space orientation="vertical" size={0}>
          <Text strong>#{c.oposicion_id} · {c.titulo}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{nombreCategoria(c.categoria_id)} · {c.compania}</Text>
        </Space>
      ),
    },
    {
      title: 'Ficha candidata',
      key: 'ficha',
      render: (_, c) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{c.origen_id} <Text type="secondary">({TABLA_LABEL[c.origen_tabla]})</Text></Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{c.organismo} · {c.cuerpo_categoria}</Text>
        </Space>
      ),
    },
    {
      title: 'Coincidencia',
      key: 'coincidencia',
      width: 210,
      render: (_, c) => {
        const n = Number(c.candidatos);
        return (
          <Space orientation="vertical" size={2}>
            {c.categoria_coincide
              ? <Tag color="green">Misma categoría</Tag>
              : <Tag color="red">Categoría distinta</Tag>}
            {n > 1 && <Tag color="orange">Ambigua: {n} fichas candidatas</Tag>}
            {c.ficha_ya_vinculada && <Tag>Ficha ya vinculada a otra</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Convocatoria',
      dataIndex: 'url_convocatoria',
      key: 'url',
      width: 120,
      render: (url) => <a href={url} target="_blank" rel="noopener noreferrer"><LinkOutlined /> Abrir</a>,
    },
    {
      title: '',
      key: 'acciones',
      width: 120,
      render: (_, c) => {
        const key = `${c.oposicion_id}|${c.origen_tabla}|${c.origen_id}`;
        return (
          <Popconfirm
            title="¿Es la misma oposición?"
            description="Se enlaza con la ficha sin cambiar ningún dato del catálogo."
            okText="Sí, vincular"
            cancelText="Cancelar"
            disabled={c.ficha_ya_vinculada}
            onConfirm={async () => {
              setVinculando(key);
              try {
                await fichasPublicacionService.vincularOposicion(c.oposicion_id, c.origen_tabla, c.origen_id);
                notify.success(`Oposición #${c.oposicion_id} vinculada con ${c.origen_id}`);
                loadConciliacion();
              } catch (err) {
                notify.error(errorMessage(err, 'No se pudo vincular'));
              } finally {
                setVinculando(null);
              }
            }}
          >
            <Button disabled={c.ficha_ya_vinculada} loading={vinculando === key}>Vincular</Button>
          </Popconfirm>
        );
      },
    },
  ];

  const opcionesMunicipio = useMemo(
    () => municipios.map((m) => ({ value: m.id, label: m.nombre })),
    [municipios],
  );

  // --- Render -----------------------------------------------------------------

  const f = fichaActual;
  const problemasPendientes = f?.problemas ?? [];

  return (
    <div>
      <div className="admin-header">
        <div className="header-content">
          <Title level={2} className="admin-title">Publicar fichas</Title>
          <Text type="secondary" className="admin-subtitle">
            Revisa las fichas del registro y publícalas en el catálogo de oposiciones
          </Text>
        </div>
        <Segmented
          value={vista}
          onChange={(v) => setVista(v as 'fichas' | 'conciliacion')}
          options={[
            { value: 'fichas', label: 'Fichas' },
            { value: 'conciliacion', label: 'Conciliar catálogo existente' },
          ]}
        />
      </div>

      {vista === 'fichas' ? (
        <>
          <Card className="filters-card">
            <div className="filters-header">
              <Space>
                <FilterOutlined />
                <Text strong>Filtros</Text>
              </Space>
              <Button icon={<ReloadOutlined />} onClick={loadFichas} loading={loading}>Recargar</Button>
            </div>
            <div className="filters-content">
              <Input
                placeholder="Buscar por ID, organismo, provincia..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="search-input"
                allowClear
              />
              <Select
                placeholder="Situación"
                value={situacion}
                onChange={(v) => { setSituacion(v); setPage(1); }}
                allowClear
                className="filter-select-sm"
                options={(Object.keys(SITUACION_INFO) as SituacionFicha[]).map((s) => ({ value: s, label: SITUACION_INFO[s].label }))}
              />
              <Select
                placeholder="Origen"
                value={origenTabla}
                onChange={(v) => { setOrigenTabla(v); setPage(1); }}
                allowClear
                className="filter-select-sm"
                options={(Object.keys(TABLA_LABEL) as OrigenTabla[]).map((t) => ({ value: t, label: TABLA_LABEL[t] }))}
              />
            </div>
          </Card>

          <Card className="table-card">
            {loading ? (
              <div className="loading-container"><Spin size="large" tip="Cargando fichas..." /></div>
            ) : (
              <Table
                columns={columnasFichas}
                dataSource={fichas}
                rowKey={(r) => `${r.origen_tabla}|${r.origen_id}`}
                size="middle"
                className="admin-table"
                scroll={{ x: 1000 }}
                locale={{ emptyText: <Empty description="No hay fichas con estos filtros" /> }}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  showTotal: (t, range) => <Text type="secondary">{range[0]}-{range[1]} de {t} fichas</Text>,
                  onChange: (p, s) => { setPage(p); setPageSize(s); },
                }}
              />
            )}
          </Card>
        </>
      ) : (
        <Card className="table-card">
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            title="Oposiciones que ya estaban en el catálogo y coinciden con una ficha por su convocatoria"
            description="Vincular no cambia ningún dato de la oposición: solo evita que esa ficha se publique como una oposición nueva duplicada. Revisa las ambiguas o de categoría distinta antes de vincular."
          />
          {loadingConc ? (
            <div className="loading-container"><Spin size="large" tip="Buscando coincidencias..." /></div>
          ) : (
            <Table
              columns={columnasConciliacion}
              dataSource={candidatos}
              rowKey={(c) => `${c.oposicion_id}|${c.origen_tabla}|${c.origen_id}`}
              size="middle"
              className="admin-table"
              pagination={{ pageSize: 20 }}
              locale={{ emptyText: <Empty description="No hay oposiciones pendientes de conciliar" /> }}
            />
          )}
        </Card>
      )}

      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: { colorBgContainer: '#ffffff', colorText: '#1a2332', colorTextSecondary: '#5a6678', colorBorder: '#d1d5db', colorPrimary: '#23C27B' },
        }}
      >
      <Modal
        open={!!f}
        title={f ? `Ficha ${f.origen_id} · ${TABLA_LABEL[f.origen_tabla]}` : ''}
        onCancel={cerrarRevision}
        width={760}
        className="admin-modal"
        destroyOnHidden
        footer={[
          <Button key="cancel" onClick={cerrarRevision}>Cancelar</Button>,
          <Button key="ok" type="primary" icon={<CloudUploadOutlined />} loading={publicando} onClick={publicar}>
            {f?.situacion === 'publicada' ? 'Aprobar y actualizar' : 'Aprobar y publicar'}
          </Button>,
        ]}
      >
        {f && (
          <>
            {problemasPendientes.length > 0 ? (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                style={{ marginBottom: 16 }}
                title="La ficha no trae estos datos verificados: complétalos abajo"
                description={<ul style={{ margin: 0, paddingLeft: 16 }}>{problemasPendientes.map((p) => <li key={p}>{p}</li>)}</ul>}
              />
            ) : (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                style={{ marginBottom: 16 }}
                title="La ficha tiene todos los datos necesarios"
              />
            )}

            <Descriptions
              size="small"
              column={2}
              bordered
              style={{ marginBottom: 20 }}
              styles={{ label: { width: 140, fontWeight: 500 } }}
            >
              <Descriptions.Item label="Organismo" span={2}>{f.organismo || '—'}</Descriptions.Item>
              <Descriptions.Item label="Categoría">{f.cuerpo_categoria || '—'}</Descriptions.Item>
              <Descriptions.Item label="Acceso">{f.acceso || '—'}</Descriptions.Item>
              <Descriptions.Item label="Estado en la ficha">{f.estado_ficha || '—'}</Descriptions.Item>
              <Descriptions.Item label="Plazas en la ficha">{f.plazas_ficha || '—'}</Descriptions.Item>
              <Descriptions.Item label="Provincia / municipio">
                {[f.provincia, f.municipio].filter(Boolean).join(' · ') || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Fin de plazo">
                {f.propuesta_fecha_fin ? dayjs(f.propuesta_fecha_fin).format('DD/MM/YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Bases" span={2}><Enlaces links={f.bases_links} /></Descriptions.Item>
              <Descriptions.Item label="Convocatoria" span={2}><Enlaces links={f.convocatoria_enlace_links} /></Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" requiredMark className="modal-form-light">
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item name="compania" label="Compañía" rules={[{ required: true, message: 'Indica la compañía' }]}>
                    <Select placeholder="Compañía" options={COMPANIAS.map((c) => ({ value: c, label: c }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="estado" label="Estado en el catálogo" rules={[{ required: true, message: 'Indica el estado' }]}>
                    <Select placeholder="Estado" options={ESTADOS_CATALOGO.map((e) => ({ value: e, label: e }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="num_plazas"
                    label="Plazas"
                    rules={[{ required: true, message: 'Indica las plazas verificadas' }]}
                    tooltip="Solo plazas verificadas en las bases o la convocatoria; nunca estimadas."
                  >
                    <InputNumber min={1} placeholder="Plazas" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item name="categoria_id" label="Categoría" rules={[{ required: true, message: 'Indica la categoría' }]}>
                    <Select placeholder="Categoría" options={categorias.map((c) => ({ value: c.id, label: c.nombre }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="provincia_id" label="Provincia" rules={[{ required: true, message: 'Indica la provincia' }]}>
                    <Select showSearch optionFilterProp="label" placeholder="Provincia" options={provincias.map((p) => ({ value: p.id, label: p.nombre }))} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="municipio_id" label="Municipio">
                    <Select showSearch allowClear optionFilterProp="label" placeholder="Municipio (opcional)" options={opcionesMunicipio} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="titulo" label="Título en el catálogo" rules={[{ max: 255 }]}>
                <Input placeholder={f.propuesta_titulo ?? ''} />
              </Form.Item>
              <Form.Item
                name="sincronizar"
                label="Mantener sincronizada con la ficha"
                valuePropName="checked"
                tooltip="Si lo desactivas, una vez publicada la oposición no se volverá a sobrescribir con datos de la ficha."
              >
                <Switch />
              </Form.Item>
            </Form>

            {f.aprobado_por && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Última aprobación: {f.aprobado_por}
                {f.aprobado_en ? ` · ${dayjs(f.aprobado_en).format('DD/MM/YYYY HH:mm')}` : ''}
                {f.propuesta_provincia_id && ` · Provincia propuesta: ${nombreProvincia(f.propuesta_provincia_id)}`}
              </Text>
            )}
          </>
        )}
      </Modal>
      </ConfigProvider>
    </div>
  );
};

export default AdminPublicacionFichas;
