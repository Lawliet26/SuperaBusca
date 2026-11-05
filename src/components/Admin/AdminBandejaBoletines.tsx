import React, { useEffect, useMemo, useState } from 'react';
import {
  Table, Button, Space, Tag, Input, Select, Modal, Form, InputNumber, Switch, AutoComplete, Radio,
  Typography, Card, Spin, Tooltip, Alert, Popconfirm, Descriptions, Empty, DatePicker,
  ConfigProvider, theme, Row, Col, List,
} from 'antd';
import {
  ReloadOutlined, SearchOutlined, FilterOutlined, LinkOutlined, PlusCircleOutlined,
  DeleteOutlined, UndoOutlined, WarningOutlined, BranchesOutlined, FilePdfOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { notify } from '@/utils/notify';
import {
  bandejaBoletinesService,
  HallazgoBandeja,
  BoletinFuente,
  EstadoRevision,
  PromoverPayload,
} from '../../services/bandejaBoletinesService';
import { fichasPublicacionService, FichaPublicacion, OrigenTabla } from '../../services/fichasPublicacionService';
import { provinciasService, Provincia } from '../../services/provinciasService';
import { municipiosService, Municipio } from '../../services/municipiosService';
import './AdminOposiciones.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ESTADO_INFO: Record<EstadoRevision, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'gold' },
  promovido: { label: 'Promovido', color: 'green' },
  vinculado: { label: 'Vinculado', color: 'blue' },
  descartado: { label: 'Descartado', color: 'default' },
};

const TABLA_LABEL: Record<OrigenTabla, string> = {
  registro_unico: 'Registro',
  hallazgos_boletines: 'Hallazgos',
};

// Estados que acepta hallazgos_boletines (en minúsculas, como en la ficha).
const ESTADOS_FICHA = ['por verificar', 'abierta', 'en curso', 'cerrada', 'pendiente de convocatoria'];
const CATEGORIAS_SUGERIDAS = ['Auxiliar Administrativo', 'Administrativo'];
const ACCESOS_SUGERIDOS = ['Libre', 'Promoción interna', 'Estabilización', 'Discapacidad'];

const MOTIVOS_IA: Record<string, string> = {
  organismo: 'organismo',
  cuerpo_categoria: 'categoría',
  provincia: 'provincia',
  plazas_num: 'número de plazas',
  plazo_inicio: 'inicio del plazo',
  plazo_fin: 'fin del plazo',
  tipo_registro: 'si es oferta o convocatoria',
  categoria_fuera_de_ambito: 'la categoría no parece de administrativos',
  correccion_de_otra_publicacion: 'parece una corrección de una publicación anterior',
};
const textoMotivoIA = (m: string) => MOTIVOS_IA[m] ?? m;

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const AdminBandejaBoletines: React.FC = () => {
  // Catálogos
  const [boletines, setBoletines] = useState<BoletinFuente[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);

  // Bandeja
  const [hallazgos, setHallazgos] = useState<HallazgoBandeja[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState<EstadoRevision | undefined>('pendiente');
  const [sourceId, setSourceId] = useState<string | undefined>();
  const [rango, setRango] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs().subtract(7, 'day'), null]);
  const [relevantes, setRelevantes] = useState(false);
  const [sinPersonales, setSinPersonales] = useState(true);
  const [conocido, setConocido] = useState<'si' | 'no' | undefined>();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [descartando, setDescartando] = useState(false);

  // Promover
  const [aPromover, setAPromover] = useState<HallazgoBandeja | null>(null);
  const [promoviendo, setPromoviendo] = useState(false);
  const [form] = Form.useForm();

  // Vincular
  const [aVincular, setAVincular] = useState<HallazgoBandeja | null>(null);
  const [fichaBusqueda, setFichaBusqueda] = useState('');
  const [fichasEncontradas, setFichasEncontradas] = useState<FichaPublicacion[]>([]);
  const [buscandoFichas, setBuscandoFichas] = useState(false);
  const [destino, setDestino] = useState<{ tabla: OrigenTabla; id: string } | null>(null);
  const [notaVinculo, setNotaVinculo] = useState('');
  const [vinculando, setVinculando] = useState(false);

  const loadBoletines = () =>
    bandejaBoletinesService.getBoletines().then(setBoletines).catch(() => notify.error('No se pudieron cargar los boletines'));

  useEffect(() => {
    loadBoletines();
    Promise.all([provinciasService.getProvincias(), municipiosService.getMunicipios()])
      .then(([p, m]) => { setProvincias(p); setMunicipios(m); })
      .catch(() => notify.error('No se pudieron cargar provincias o municipios'));
  }, []);

  // Búsqueda con debounce para no llamar al backend en cada tecla
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchText.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const loadHallazgos = async () => {
    setLoading(true);
    try {
      const { data, total } = await bandejaBoletinesService.getHallazgos({
        estado,
        source_id: sourceId,
        desde: rango?.[0]?.format('YYYY-MM-DD'),
        hasta: rango?.[1]?.format('YYYY-MM-DD'),
        relevantes,
        sin_personales: sinPersonales,
        conocido,
        search: search || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setHallazgos(data);
      setTotal(total);
      setSeleccion([]);
    } catch (err) {
      notify.error(errorMessage(err, 'Error al cargar la bandeja'));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadHallazgos(); }, [estado, sourceId, rango, relevantes, sinPersonales, conocido, search, page, pageSize]);

  const recargarTodo = () => { loadHallazgos(); loadBoletines(); };

  // --- Acciones ---------------------------------------------------------------

  const abrirPromover = (h: HallazgoBandeja) => {
    setAPromover(h);
    // Territorio del boletín + borrador de la IA si lo hay. La persona verifica y corrige.
    const s = h.sugerencia_ia?.es_relevante ? h.sugerencia_ia : null;
    const plazo = s && (s.plazo_inicio || s.plazo_fin)
      ? `Plazo según IA: ${s.plazo_inicio ? dayjs(s.plazo_inicio).format('DD/MM/YYYY') : '?'} – ${s.plazo_fin ? dayjs(s.plazo_fin).format('DD/MM/YYYY') : '?'}`
      : '';
    const c = s ? h.complemento_ia : null;
    const enlaceConfirmado = h.verificacion_ia?.campos?.fuente_oficial === 'ok' ? h.enlaces_ia?.[0] : undefined;
    form.setFieldsValue({
      sistema_selectivo: c?.campos.sistema_selectivo?.valor ?? s?.sistema ?? '',
      turno: c?.campos.turno?.valor ?? '',
      plazo_solicitud: c?.campos.plazo_solicitud?.valor ?? '',
      bases_url: c?.fuente ?? enlaceConfirmado ?? '',
      portal_url: h.portales_conocidos?.[0] ?? '',
      tipo_registro: s?.tipo_registro === 'oferta' || s?.tipo_registro === 'convocatoria' ? s.tipo_registro : undefined,
      organismo: s?.organismo ?? '',
      cuerpo_categoria: s?.cuerpo_categoria ?? undefined,
      provincia: s?.provincia ?? h.provincia ?? undefined,
      municipio: s?.municipio ?? undefined,
      ccaa: s?.ccaa ?? h.ccaa ?? undefined,
      convocante: '',
      acceso: c?.campos.acceso?.valor ?? s?.acceso ?? undefined,
      estado: 'por verificar',
      plazas_num: s?.plazas_num ?? undefined,
      nota: [s?.resumen, plazo].filter(Boolean).join(' · ').slice(0, 500),
    });
  };

  const cerrarPromover = () => { setAPromover(null); form.resetFields(); };

  const promover = async () => {
    if (!aPromover) return;
    const v = await form.validateFields();
    const limpio = (s?: string | null) => (s ?? '').trim() || null;
    const datos: PromoverPayload = {
      tipo_registro: v.tipo_registro,
      organismo: v.organismo.trim(),
      cuerpo_categoria: v.cuerpo_categoria.trim(),
      provincia: v.provincia.trim(),
      municipio: limpio(v.municipio),
      ccaa: limpio(v.ccaa),
      convocante: limpio(v.convocante),
      acceso: limpio(v.acceso),
      estado: v.estado,
      plazas_num: v.plazas_num ?? null,
      nota: limpio(v.nota),
      sistema_selectivo: limpio(v.sistema_selectivo),
      turno: limpio(v.turno),
      plazo_solicitud: limpio(v.plazo_solicitud),
      bases_url: limpio(v.bases_url),
      portal_url: limpio(v.portal_url),
    };
    setPromoviendo(true);
    try {
      const { id_hallazgo } = await bandejaBoletinesService.promover(aPromover.id, datos);
      notify.success(`Ficha ${id_hallazgo} creada. Publícala desde «Publicar fichas».`);
      cerrarPromover();
      recargarTodo();
    } catch (err) {
      // El backend devuelve el motivo exacto (p. ej. "ya está en la ficha …: usar Vincular")
      notify.error(errorMessage(err, 'No se pudo promover el hallazgo'));
    } finally {
      setPromoviendo(false);
    }
  };

  const abrirVincular = (h: HallazgoBandeja) => {
    setAVincular(h);
    setDestino(h.conocido_en[0] ?? null);
    setFichaBusqueda('');
    setFichasEncontradas([]);
    setNotaVinculo('');
  };

  // Busca fichas existentes reutilizando el listado de «Publicar fichas».
  useEffect(() => {
    if (!aVincular) return;
    const q = fichaBusqueda.trim();
    if (q.length < 2) { setFichasEncontradas([]); return; }
    const t = setTimeout(async () => {
      setBuscandoFichas(true);
      try {
        const { data } = await fichasPublicacionService.getFichas({ search: q, limit: 10 });
        setFichasEncontradas(data);
      } catch (err) {
        notify.error(errorMessage(err, 'Error al buscar fichas'));
      } finally {
        setBuscandoFichas(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [fichaBusqueda, aVincular]);

  const vincular = async () => {
    if (!aVincular || !destino) return;
    setVinculando(true);
    try {
      await bandejaBoletinesService.vincular(aVincular.id, destino.tabla, destino.id, notaVinculo.trim());
      notify.success(`Enlace añadido a la ficha ${destino.id}`);
      setAVincular(null);
      recargarTodo();
    } catch (err) {
      notify.error(errorMessage(err, 'No se pudo vincular'));
    } finally {
      setVinculando(false);
    }
  };

  const descartar = async (ids: number[]) => {
    setDescartando(true);
    try {
      const { descartados } = await bandejaBoletinesService.descartar(ids);
      notify.success(descartados === 1 ? 'Hallazgo descartado' : `${descartados} hallazgos descartados`);
      recargarTodo();
    } catch (err) {
      notify.error(errorMessage(err, 'No se pudo descartar'));
    } finally {
      setDescartando(false);
    }
  };

  const reabrir = async (h: HallazgoBandeja) => {
    try {
      await bandejaBoletinesService.reabrir(h.id);
      notify.success('Hallazgo devuelto a pendientes');
      recargarTodo();
    } catch (err) {
      notify.error(errorMessage(err, 'No se pudo reabrir'));
    }
  };

  // --- Tabla ------------------------------------------------------------------

  const columnas: ColumnsType<HallazgoBandeja> = [
    {
      title: 'Publicación',
      key: 'publicacion',
      width: 220,
      render: (_, h) => (
        <Space orientation="vertical" size={0}>
          <Text strong style={{ wordBreak: 'break-all' }}>
            {h.source_id === 'BOE' ? h.publication_id : h.publication_id.split('/').pop()}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(h.fecha_publicacion).format('DD/MM/YYYY')}
            {h.seccion ? ` · Sección ${h.seccion}` : ''}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Boletín',
      key: 'boletin',
      render: (_, h) => (
        <Space orientation="vertical" size={0}>
          <Text>{h.boletin}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {[h.ambito, h.provincia || h.ccaa].filter(Boolean).join(' · ')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Señales',
      key: 'senales',
      width: 260,
      render: (_, h) => (
        <Space size={[4, 4]} wrap>
          {h.menciona_categoria && (
            <Tooltip title={`Páginas: ${(h.paginas_categoria ?? []).join(', ')}`}>
              <Tag color="green">Menciona la categoría</Tag>
            </Tooltip>
          )}
          {h.sugerencia_ia && (
            <Tooltip
              title={h.sugerencia_ia.es_relevante
                ? [h.sugerencia_ia.organismo, h.sugerencia_ia.cuerpo_categoria, h.sugerencia_ia.plazas_num ? `${h.sugerencia_ia.plazas_num} plazas` : null, h.sugerencia_ia.resumen]
                    .filter(Boolean).join(' · ')
                : 'La IA no ve aquí una oferta ni una convocatoria'}
            >
              <Tag color={h.sugerencia_ia.es_relevante ? 'purple' : 'default'}>
                {h.sugerencia_ia.es_relevante ? `IA: ${h.sugerencia_ia.tipo_registro ?? 'relevante'}` : 'IA: no relevante'}
              </Tag>
            </Tooltip>
          )}
          {h.sugerencia_ia?.es_relevante && h.verificacion_ia?.estado === 'verificado' && (
            <Tooltip title="Cada dato de la IA aparece en las páginas leídas. Igual hay que confirmarlo.">
              <Tag color="green">Datos encontrados en el PDF</Tag>
            </Tooltip>
          )}
          {h.sugerencia_ia?.es_relevante && h.verificacion_ia?.estado === 'revisar' && (
            <Tooltip title={h.verificacion_ia.motivos.map(textoMotivoIA).join(' · ')}>
              <Tag color="orange">Revisar datos de la IA</Tag>
            </Tooltip>
          )}
          {!!h.posibles_fichas?.length && !h.conocido_en.length && (
            <Tooltip title={h.posibles_fichas.map((f) => `${f.id}: ${f.organismo ?? ''} · ${f.cuerpo_categoria ?? ''}`).join(' | ')}>
              <Tag color="blue">Posible ficha existente</Tag>
            </Tooltip>
          )}
          {!!h.posibles_duplicados?.length && (
            <Tooltip title={h.posibles_duplicados.map((d) => `${d.source_id} ${d.publication_id}`).join(' | ')}>
              <Tag color="gold">Posible duplicado</Tag>
            </Tooltip>
          )}
          {h.datos_personales && <Tag color="red" icon={<WarningOutlined />}>Datos personales</Tag>}
          {h.paginas ? <Tag>PDF leído · {h.paginas} pág.</Tag> : <Tag color="default">PDF sin leer</Tag>}
          {h.conocido_en.map((f) => (
            <Tag key={`${f.tabla}|${f.id}`} color="blue">Ya en {f.id}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Documento',
      key: 'url',
      width: 110,
      render: (_, h) => (
        <a href={h.url} target="_blank" rel="noopener noreferrer"><FilePdfOutlined /> Abrir</a>
      ),
    },
    {
      title: '',
      key: 'acciones',
      width: 280,
      render: (_, h) => {
        if (h.estado_revision !== 'pendiente') {
          const info = ESTADO_INFO[h.estado_revision];
          return (
            <Space orientation="vertical" size={2}>
              <Space size={4}>
                <Tag color={info.color}>{info.label}</Tag>
                {h.destino_id && <Text type="secondary">→ {h.destino_id}</Text>}
                {h.estado_revision === 'descartado' && (
                  <Button size="small" icon={<UndoOutlined />} onClick={() => reabrir(h)}>Reabrir</Button>
                )}
              </Space>
              {h.revisado_por && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {h.revisado_por}{h.revisado_en ? ` · ${dayjs(h.revisado_en).format('DD/MM/YYYY')}` : ''}
                </Text>
              )}
            </Space>
          );
        }
        const conocidoYa = h.conocido_en.length > 0;
        return (
          <Space size={4} wrap>
            <Tooltip title={conocidoYa ? 'Este documento ya está en una ficha: vincúlalo' : ''}>
              <Button type="primary" size="small" icon={<PlusCircleOutlined />} disabled={conocidoYa} onClick={() => abrirPromover(h)}>
                Promover
              </Button>
            </Tooltip>
            <Button size="small" icon={<BranchesOutlined />} type={conocidoYa ? 'primary' : 'default'} onClick={() => abrirVincular(h)}>
              Vincular
            </Button>
            <Popconfirm title="¿Descartar este hallazgo?" okText="Descartar" cancelText="Cancelar" onConfirm={() => descartar([h.id])}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const opcionesBoletin = useMemo(
    () => boletines.map((b) => ({
      value: b.source_id,
      label: `${b.nombre}${Number(b.pendientes) > 0 ? ` (${b.pendientes})` : ''}`,
    })),
    [boletines],
  );
  const opcionesProvincia = useMemo(() => provincias.map((p) => ({ value: p.nombre })), [provincias]);
  const opcionesMunicipio = useMemo(() => municipios.map((m) => ({ value: m.nombre })), [municipios]);
  const filtrarOpcion = (input: string, option?: { value: string }) =>
    (option?.value ?? '').toLowerCase().includes(input.toLowerCase());

  // --- Render -----------------------------------------------------------------

  const p = aPromover;
  const v = aVincular;

  return (
    <div>
      <div className="admin-header">
        <div className="header-content">
          <Title level={2} className="admin-title">Bandeja de boletines</Title>
          <Text type="secondary" className="admin-subtitle">
            Lo que el scraper encontró cada día en el BOE y los boletines. Promueve lo que sea una oferta o convocatoria real.
          </Text>
        </div>
      </div>

      <Card className="filters-card">
        <div className="filters-header">
          <Space>
            <FilterOutlined />
            <Text strong>Filtros</Text>
          </Space>
          <Space>
            {estado === 'pendiente' && seleccion.length > 0 && (
              <Popconfirm
                title={`¿Descartar ${seleccion.length} hallazgos?`}
                okText="Descartar"
                cancelText="Cancelar"
                onConfirm={() => descartar(seleccion)}
              >
                <Button danger icon={<DeleteOutlined />} loading={descartando}>
                  Descartar seleccionados ({seleccion.length})
                </Button>
              </Popconfirm>
            )}
            <Button icon={<ReloadOutlined />} onClick={recargarTodo} loading={loading}>Recargar</Button>
          </Space>
        </div>
        <div className="filters-content">
          <Input
            placeholder="Buscar por referencia, boletín, provincia..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
            allowClear
          />
          <Select
            placeholder="Estado"
            value={estado}
            onChange={(val) => { setEstado(val); setPage(1); }}
            allowClear
            className="filter-select-sm"
            options={(Object.keys(ESTADO_INFO) as EstadoRevision[]).map((s) => ({ value: s, label: ESTADO_INFO[s].label }))}
          />
          <Select
            placeholder="Boletín"
            value={sourceId}
            onChange={(val) => { setSourceId(val); setPage(1); }}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ minWidth: 260 }}
            options={opcionesBoletin}
          />
          <RangePicker
            value={rango}
            onChange={(r) => { setRango(r as [Dayjs | null, Dayjs | null] | null); setPage(1); }}
            format="DD/MM/YYYY"
            allowEmpty={[true, true]}
            placeholder={['Desde', 'Hasta']}
          />
          <Select
            placeholder="Conocidos"
            value={conocido}
            onChange={(val) => { setConocido(val); setPage(1); }}
            allowClear
            className="filter-select-sm"
            options={[{ value: 'no', label: 'Solo nuevos' }, { value: 'si', label: 'Ya en una ficha' }]}
          />
          <Space>
            <Switch checked={relevantes} onChange={(c) => { setRelevantes(c); setPage(1); }} />
            <Text>Solo los que mencionan la categoría</Text>
          </Space>
          <Space>
            <Switch checked={sinPersonales} onChange={(c) => { setSinPersonales(c); setPage(1); }} />
            <Text>Ocultar los que tienen datos personales</Text>
          </Space>
        </div>
      </Card>

      <Card className="table-card">
        {loading ? (
          <div className="loading-container"><Spin size="large" tip="Cargando la bandeja..." /></div>
        ) : (
          <Table
            columns={columnas}
            dataSource={hallazgos}
            rowKey="id"
            size="middle"
            className="admin-table"
            scroll={{ x: 1100 }}
            rowSelection={estado === 'pendiente' ? {
              selectedRowKeys: seleccion,
              onChange: (keys) => setSeleccion(keys as number[]),
            } : undefined}
            locale={{ emptyText: <Empty description="No hay hallazgos con estos filtros" /> }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100'],
              showTotal: (t, range) => <Text type="secondary">{range[0]}-{range[1]} de {t} hallazgos</Text>,
              onChange: (pg, s) => { setPage(pg); setPageSize(s); },
            }}
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
          open={!!p}
          title={p ? `Promover ${p.source_id === 'BOE' ? p.publication_id : 'documento'} a una ficha nueva` : ''}
          onCancel={cerrarPromover}
          width={760}
          className="admin-modal"
          destroyOnHidden
          footer={[
            <Button key="cancel" onClick={cerrarPromover}>Cancelar</Button>,
            <Button key="ok" type="primary" icon={<PlusCircleOutlined />} loading={promoviendo} onClick={promover}>
              Crear ficha
            </Button>,
          ]}
        >
          {p && (
            <>
              {p.sugerencia_ia?.es_relevante ? (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  title={`Datos precompletados por IA${p.sugerencia_ia.modelo ? ` (${p.sugerencia_ia.modelo})` : ''}: verifícalos contra el documento`}
                  description={
                    <>
                      La IA leyó solo las páginas {(p.paginas_ia ?? []).join(', ')} y puede equivocarse.
                      {p.sugerencia_ia.pagina_evidencia ? <> Dato principal en la{' '}
                        <a href={`${p.url}#page=${p.sugerencia_ia.pagina_evidencia}`} target="_blank" rel="noopener noreferrer">página {p.sugerencia_ia.pagina_evidencia}</a>.</> : null}
                      {' '}La ficha se crea en «Hallazgos» y después se publica desde «Publicar fichas».
                      {p.verificacion_ia?.estado === 'revisar' && (
                        <div style={{ marginTop: 8 }}>
                          <strong>Comprueba especialmente:</strong> {p.verificacion_ia.motivos.map(textoMotivoIA).join(' · ')}
                        </div>
                      )}
                      {!!p.enlaces_ia?.length && (
                        <div style={{ marginTop: 8 }}>
                          <strong>Enlaces citados en el anuncio (sin comprobar):</strong>{' '}
                          {p.enlaces_ia.map((u) => (
                            <div key={u}><a href={u} target="_blank" rel="noopener noreferrer"><LinkOutlined /> {u}</a></div>
                          ))}
                        </div>
                      )}
                    </>
                  }
                />
              ) : (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  title="El scraper solo trae el enlace y la fecha"
                  description="Abre el documento y completa los datos tal como figuran en él. La ficha se crea en «Hallazgos» y después se publica desde «Publicar fichas»."
                />
              )}
              {!!p.posibles_fichas?.length && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  title="Puede que este proceso ya tenga ficha: revísalo antes de crear otra"
                  description={p.posibles_fichas.map((f) => (
                    <div key={`${f.tabla}|${f.id}`} style={{ marginTop: 4 }}>
                      <strong>{f.id}</strong> · {[f.organismo, f.cuerpo_categoria, f.tipo_registro, f.plazas_num ? `${f.plazas_num} plazas` : null, f.estado].filter(Boolean).join(' · ')}{' '}
                      <Button
                        size="small"
                        type="link"
                        onClick={() => { const h = p; cerrarPromover(); abrirVincular(h); setFichaBusqueda(f.id); }}
                      >
                        Vincular a esta ficha
                      </Button>
                    </div>
                  ))}
                />
              )}
              {!!p.posibles_duplicados?.length && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  title="El mismo organismo y categoría aparece en otros avisos de la bandeja"
                  description={p.posibles_duplicados.map((d) => (
                    <div key={d.id}>
                      <a href={d.url} target="_blank" rel="noopener noreferrer"><LinkOutlined /> {d.source_id} {d.publication_id}</a>
                      {' '}· {dayjs(d.fecha_publicacion).format('DD/MM/YYYY')} · {ESTADO_INFO[d.estado_revision]?.label ?? d.estado_revision}
                    </div>
                  ))}
                />
              )}
              {!!p.complemento_ia && Object.keys(p.complemento_ia.campos).length > 0 && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                  title="Datos sacados de las bases, con su página"
                  description={Object.entries(p.complemento_ia.campos).map(([k, v]) => (
                    <div key={k}>
                      <strong>{k.replace('_', ' ')}:</strong> {v?.valor}{' '}
                      <a href={`${p.complemento_ia!.fuente}#page=${v?.pagina}`} target="_blank" rel="noopener noreferrer">(pág. {v?.pagina})</a>
                    </div>
                  ))}
                />
              )}
              {p.datos_personales && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  title="Este documento contiene datos personales"
                  description="Suele tratarse de listas o nombramientos, no de ofertas. No copies nombres ni DNIs a la ficha."
                />
              )}
              <Descriptions size="small" column={2} bordered style={{ marginBottom: 20 }} styles={{ label: { width: 120, fontWeight: 500 } }}>
                <Descriptions.Item label="Boletín" span={2}>{p.boletin}</Descriptions.Item>
                <Descriptions.Item label="Fecha">{dayjs(p.fecha_publicacion).format('DD/MM/YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Documento">
                  <a href={p.url} target="_blank" rel="noopener noreferrer"><LinkOutlined /> Abrir PDF</a>
                </Descriptions.Item>
              </Descriptions>

              <Form form={form} layout="vertical" requiredMark className="modal-form-light">
                <Form.Item name="tipo_registro" label="¿Qué es?" rules={[{ required: true, message: 'Indica si es oferta o convocatoria' }]}>
                  <Radio.Group
                    optionType="button"
                    buttonStyle="solid"
                    options={[{ value: 'oferta', label: 'Oferta (OEP)' }, { value: 'convocatoria', label: 'Convocatoria' }]}
                  />
                </Form.Item>
                <Row gutter={16}>
                  <Col xs={24} sm={14}>
                    <Form.Item name="organismo" label="Organismo" rules={[{ required: true, whitespace: true, message: 'Indica el organismo' }, { max: 500 }]}>
                      <Input placeholder="Ej.: Ayuntamiento de Getafe" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={10}>
                    <Form.Item name="cuerpo_categoria" label="Cuerpo / categoría" rules={[{ required: true, whitespace: true, message: 'Indica la categoría' }, { max: 500 }]}>
                      <AutoComplete options={CATEGORIAS_SUGERIDAS.map((c) => ({ value: c }))} placeholder="Auxiliar Administrativo" filterOption={filtrarOpcion} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Form.Item name="provincia" label="Provincia" rules={[{ required: true, whitespace: true, message: 'Indica la provincia' }]}>
                      <AutoComplete options={opcionesProvincia} placeholder="Provincia" filterOption={filtrarOpcion} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="municipio" label="Municipio">
                      <AutoComplete options={opcionesMunicipio} placeholder="Opcional" filterOption={filtrarOpcion} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="ccaa" label="Comunidad autónoma">
                      <Input placeholder="Opcional" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Form.Item name="estado" label="Estado">
                      <Select options={ESTADOS_FICHA.map((e) => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="plazas_num" label="Plazas" tooltip="Solo si el documento las indica; nunca estimadas.">
                      <InputNumber min={1} placeholder="Opcional" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="acceso" label="Acceso">
                      <AutoComplete options={ACCESOS_SUGERIDOS.map((a) => ({ value: a }))} placeholder="Opcional" filterOption={filtrarOpcion} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Form.Item name="sistema_selectivo" label="Sistema selectivo" rules={[{ max: 500 }]}>
                      <Input placeholder="Opcional" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="turno" label="Turno" rules={[{ max: 500 }]}>
                      <Input placeholder="Opcional" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item name="plazo_solicitud" label="Plazo de solicitud" rules={[{ max: 500 }]}>
                      <Input placeholder="Opcional" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="bases_url" label="Enlace a las bases" rules={[{ pattern: /^https:\/\/\S+$/, message: 'Debe ser un enlace https' }, { max: 500 }]}>
                      <Input placeholder="https://…" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="portal_url" label="Portal oficial" rules={[{ pattern: /^https:\/\/\S+$/, message: 'Debe ser un enlace https' }, { max: 500 }]}>
                      <Input placeholder="https://…" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="convocante" label="Convocante" rules={[{ max: 500 }]}>
                  <Input placeholder="Opcional, si es distinto del organismo" />
                </Form.Item>
                <Form.Item name="nota" label="Nota interna" rules={[{ max: 500 }]}>
                  <Input.TextArea rows={2} placeholder="Opcional: queda en observaciones de la ficha" />
                </Form.Item>
              </Form>
            </>
          )}
        </Modal>

        <Modal
          open={!!v}
          title="Vincular a una ficha existente"
          onCancel={() => setAVincular(null)}
          width={680}
          className="admin-modal"
          destroyOnHidden
          footer={[
            <Button key="cancel" onClick={() => setAVincular(null)}>Cancelar</Button>,
            <Button key="ok" type="primary" icon={<BranchesOutlined />} loading={vinculando} disabled={!destino} onClick={vincular}>
              {destino ? `Vincular a ${destino.id}` : 'Elige una ficha'}
            </Button>,
          ]}
        >
          {v && (
            <>
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                title="Vincular solo añade este documento a «Publicaciones y actualizaciones» de la ficha"
                description="No cambia ningún otro dato. Úsalo cuando el documento sea del mismo proceso (p. ej. el extracto del BOE de una convocatoria que ya está en una ficha)."
              />
              <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }} styles={{ label: { width: 120, fontWeight: 500 } }}>
                <Descriptions.Item label="Documento">
                  <a href={v.url} target="_blank" rel="noopener noreferrer">
                    <LinkOutlined /> {v.boletin} · {dayjs(v.fecha_publicacion).format('DD/MM/YYYY')}
                  </a>
                </Descriptions.Item>
              </Descriptions>

              {v.conocido_en.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Fichas que ya tienen este documento</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      {v.conocido_en.map((f) => (
                        <Button
                          key={`${f.tabla}|${f.id}`}
                          type={destino?.id === f.id && destino?.tabla === f.tabla ? 'primary' : 'default'}
                          onClick={() => setDestino(f)}
                        >
                          {f.id} · {TABLA_LABEL[f.tabla]}
                        </Button>
                      ))}
                    </Space>
                  </div>
                </div>
              )}

              <Text strong>Buscar otra ficha</Text>
              <Input
                style={{ marginTop: 8 }}
                placeholder="ID, organismo, provincia o municipio"
                prefix={<SearchOutlined />}
                value={fichaBusqueda}
                onChange={(e) => setFichaBusqueda(e.target.value)}
                allowClear
              />
              <List
                style={{ marginTop: 8, maxHeight: 260, overflowY: 'auto' }}
                size="small"
                loading={buscandoFichas}
                dataSource={fichasEncontradas}
                locale={{ emptyText: fichaBusqueda.trim().length < 2 ? 'Escribe al menos 2 letras' : 'Sin resultados' }}
                renderItem={(f) => {
                  const elegido = destino?.id === f.origen_id && destino?.tabla === f.origen_tabla;
                  return (
                    <List.Item
                      style={{ cursor: 'pointer', background: elegido ? 'rgba(35,194,123,0.12)' : undefined }}
                      onClick={() => setDestino({ tabla: f.origen_tabla, id: f.origen_id })}
                    >
                      <Space orientation="vertical" size={0}>
                        <Text strong>{f.origen_id} <Text type="secondary">({TABLA_LABEL[f.origen_tabla]})</Text></Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {[f.organismo, f.cuerpo_categoria, f.provincia].filter(Boolean).join(' · ')}
                        </Text>
                      </Space>
                    </List.Item>
                  );
                }}
              />
              <Input.TextArea
                style={{ marginTop: 12 }}
                rows={2}
                maxLength={500}
                placeholder="Nota interna (opcional)"
                value={notaVinculo}
                onChange={(e) => setNotaVinculo(e.target.value)}
              />
            </>
          )}
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default AdminBandejaBoletines;
