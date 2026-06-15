import React, { useState, useEffect } from 'react';
import {
  Table, Input, DatePicker, Button, Space, Card, Typography, Tag, Spin, Modal, Radio, Alert,
  ConfigProvider, theme, Select
} from 'antd';
import {
  SearchOutlined, DownloadOutlined, CalendarOutlined, ReloadOutlined,
  FilterOutlined, FilePdfOutlined, FileExcelOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { notify } from '@/utils/notify';
import {
  historialService, HistorialProfesor, HistorialRevision
} from '../../services/historialService';
import './AdminOposiciones.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PAGE_SIZE = 20;

const AdminHistorico: React.FC = () => {
  const [data, setData] = useState<HistorialProfesor[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  // Modal de exportación guiada (la selección de profesores vive acá adentro)
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [exportProfesores, setExportProfesores] = useState<HistorialProfesor[]>([]);
  const [exportSelectedIds, setExportSelectedIds] = useState<number[]>([]);
  const [loadingExportList, setLoadingExportList] = useState(false);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [searchName, setSearchName] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [searchOposicion, setSearchOposicion] = useState('');
  const [debouncedOposicion, setDebouncedOposicion] = useState('');

  // Debounce del buscador de nombre
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedName(searchName.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchName]);

  // Debounce del buscador de oposición
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedOposicion(searchOposicion.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchOposicion]);

  const buildFilters = (forExport: boolean) => ({
    start_date: dateRange?.[0]?.format('YYYY-MM-DD') || undefined,
    end_date: dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
    nombre: debouncedName || undefined,
    oposicion: debouncedOposicion || undefined,
    ...(forExport
      ? { export: true }
      : { limit: PAGE_SIZE, offset: (currentPage - 1) * PAGE_SIZE }),
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await historialService.getHistorial(buildFilters(false));
      setData(res.data);
      setTotal(res.total);
    } catch {
      notify.error('Error al cargar el histórico de revisiones');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [currentPage, debouncedName, debouncedOposicion, dateRange]);

  // Rango de fechas en texto para encabezados / export
  const rangoTexto = () =>
    dateRange?.[0] && dateRange?.[1]
      ? `${dateRange[0].format('DD/MM/YYYY')} a ${dateRange[1].format('DD/MM/YYYY')}`
      : 'Todas las fechas';

  // Genera y descarga el Excel (CSV con BOM) a partir de una lista de profesores
  const exportarExcelDe = (profesores: HistorialProfesor[]) => {
    const header = [
      'Profesor', 'ID Profesor', 'Total revisiones',
      'Oposición', 'ID Oposición', 'ID Temario', 'ID Revisión', 'Fecha de revisión',
    ];
    const rows: string[][] = [header];
    profesores.forEach((prof) => {
      (prof.revisiones || []).forEach((rev) => {
        rows.push([
          (prof.profesor_nombre || '').trim(),
          String(prof.profesor_id ?? ''),
          String(prof.total_revisiones ?? ''),
          rev.oposicion_titulo || '',
          String(rev.oposicion_id ?? ''),
          String(rev.temario_id ?? ''),
          String(rev.revision_id ?? ''),
          rev.fecha_revision ? dayjs(rev.fecha_revision).format('DD/MM/YYYY HH:mm') : '',
        ]);
      });
    });
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const bom = String.fromCharCode(0xFEFF);
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico_revisiones_${dayjs().format('YYYYMMDD_HHmm')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Carga el logo de OpoRadar (public) y lo pasa a PNG dataURL para usarlo en el PDF
  const loadLogoDataUrl = (): Promise<string | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 64;
          canvas.height = img.height || 64;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = '/isotipo-verde.ico';
    });

  const generarPdfProfesor = (prof: HistorialProfesor, logo: string | null, rango: string) => {
    const doc = new jsPDF();
    if (logo) doc.addImage(logo, 'PNG', 14, 10, 16, 16);
    doc.setFontSize(15);
    doc.setTextColor(35, 194, 123);
    doc.text('OpoRadar', logo ? 34 : 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(90, 90, 90);
    doc.text('Histórico de Revisiones', logo ? 34 : 14, 24);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(12);
    doc.text(`Profesor: ${(prof.profesor_nombre || '').trim() || '—'}`, 14, 38);
    doc.setFontSize(10);
    doc.text(`Total de revisiones: ${prof.total_revisiones ?? 0}`, 14, 45);
    doc.text(`Rango de fechas: ${rango}`, 14, 51);

    autoTable(doc, {
      startY: 57,
      head: [['Oposición', 'ID Temario', 'ID Revisión', 'Fecha de revisión']],
      body: (prof.revisiones || []).map((r) => [
        r.oposicion_titulo || '',
        String(r.temario_id ?? ''),
        String(r.revision_id ?? ''),
        r.fecha_revision ? dayjs(r.fecha_revision).format('DD/MM/YYYY HH:mm') : '',
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [35, 194, 123], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 248, 244] },
    });

    const nombre = (prof.profesor_nombre || 'profesor').trim().replace(/\s+/g, '_');
    doc.save(`historial_${nombre}.pdf`);
  };

  const generarPdfs = async (profs: HistorialProfesor[]) => {
    const logo = await loadLogoDataUrl();
    const rango = rangoTexto();
    profs.forEach((p) => generarPdfProfesor(p, logo, rango));
    notify.success(profs.length > 1 ? `${profs.length} PDF generados` : 'PDF generado correctamente');
  };

  // Abre el modal y trae la lista completa de profesores (respetando los filtros activos)
  const openExportModal = async () => {
    setExportFormat('excel');
    setExportSelectedIds([]);
    setExportModalOpen(true);
    setLoadingExportList(true);
    try {
      const res = await historialService.getHistorial(buildFilters(true));
      setExportProfesores(res.data);
    } catch {
      notify.error('No se pudo cargar la lista de profesores');
      setExportProfesores([]);
    } finally {
      setLoadingExportList(false);
    }
  };

  // Profesores que se exportan: los elegidos, o TODOS si no se eligió ninguno
  const profesoresAExportar = exportSelectedIds.length > 0
    ? exportProfesores.filter((p) => exportSelectedIds.includes(p.profesor_id))
    : exportProfesores;
  const exportCount = profesoresAExportar.length;

  const runExport = async () => {
    if (profesoresAExportar.length === 0) {
      notify.warning('No hay profesores para exportar');
      return;
    }
    if (exportFormat === 'pdf' && exportSelectedIds.length === 0) {
      notify.warning('Para exportar en PDF selecciona al menos un profesor');
      return;
    }
    setExporting(true);
    try {
      if (exportFormat === 'excel') {
        exportarExcelDe(profesoresAExportar);
        notify.success('Exportación a Excel generada correctamente');
      } else {
        await generarPdfs(profesoresAExportar);
      }
      setExportModalOpen(false);
    } catch {
      notify.error('Error al exportar los datos');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchName('');
    setDebouncedName('');
    setSearchOposicion('');
    setDebouncedOposicion('');
    setDateRange(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(searchName || searchOposicion || dateRange);

  // Revisión más reciente de un profesor (para mostrar en la fila principal)
  const ultimaRevision = (prof: HistorialProfesor): HistorialRevision | null => {
    const revs = (prof.revisiones || []).filter((r) => r.fecha_revision);
    if (!revs.length) return null;
    return revs.reduce((a, b) => (a.fecha_revision > b.fecha_revision ? a : b));
  };

  const columns: ColumnsType<HistorialProfesor> = [
    {
      title: 'Profesor',
      dataIndex: 'profesor_nombre',
      key: 'profesor_nombre',
      width: 220,
      render: (v: string) => <Text strong>{(v || '').trim() || '—'}</Text>,
    },
    {
      title: 'Oposición más reciente',
      key: 'ultima_oposicion',
      ellipsis: true,
      render: (_: unknown, prof: HistorialProfesor) => {
        const u = ultimaRevision(prof);
        return u?.oposicion_titulo ? <Text>{u.oposicion_titulo}</Text> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Última revisión',
      key: 'ultima_fecha',
      width: 180,
      render: (_: unknown, prof: HistorialProfesor) => {
        const u = ultimaRevision(prof);
        return u ? (
          <Space size={4}>
            <CalendarOutlined style={{ color: '#23C27B' }} />
            <Text>{dayjs(u.fecha_revision).format('DD/MM/YYYY')}</Text>
          </Space>
        ) : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Total revisiones',
      dataIndex: 'total_revisiones',
      key: 'total_revisiones',
      width: 150,
      align: 'center' as const,
      render: (v: number) => <Tag color="green">{v}</Tag>,
    },
  ];

  const expandedRowRender = (prof: HistorialProfesor) => {
    const revColumns: ColumnsType<HistorialRevision> = [
      { title: 'Oposición', dataIndex: 'oposicion_titulo', key: 'oposicion_titulo', ellipsis: true },
      { title: 'ID Temario', dataIndex: 'temario_id', key: 'temario_id', width: 120, align: 'center' as const },
      { title: 'ID Revisión', dataIndex: 'revision_id', key: 'revision_id', width: 120, align: 'center' as const },
      {
        title: 'Fecha de revisión',
        dataIndex: 'fecha_revision',
        key: 'fecha_revision',
        width: 190,
        render: (f: string) => f ? (
          <Space size={4}>
            <CalendarOutlined style={{ color: '#23C27B' }} />
            <Text>{dayjs(f).format('DD/MM/YYYY HH:mm')}</Text>
          </Space>
        ) : <Text type="secondary">—</Text>,
      },
    ];
    return (
      <Table
        columns={revColumns}
        dataSource={prof.revisiones}
        rowKey="revision_id"
        pagination={false}
        size="small"
      />
    );
  };

  return (
    <div className="admin-historico">
      <div className="admin-header">
        <div className="header-content">
          <Title level={2} className="admin-title">Histórico de Revisiones</Title>
          <Text type="secondary" className="admin-subtitle">
            Audita las revisiones realizadas por cada profesor
          </Text>
        </div>
        <div className="header-stats">
          <Card size="small" className="stat-card">
            <Text type="secondary">Profesores</Text>
            <Title level={3}>{total}</Title>
          </Card>
        </div>
      </div>

      <Card className="filters-card">
        <div className="filters-header">
          <Space>
            <FilterOutlined />
            <Text strong>Filtros</Text>
          </Space>
          <Space wrap>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={openExportModal}
            >
              Exportar
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
              Recargar
            </Button>
            {hasActiveFilters && (
              <Button onClick={clearFilters}>Limpiar filtros</Button>
            )}
          </Space>
        </div>

        <div className="filters-content">
          <Input
            placeholder="Buscar por nombre de profesor..."
            prefix={<SearchOutlined />}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="search-input"
            allowClear
          />
          <Input
            placeholder="Buscar por oposición..."
            prefix={<SearchOutlined />}
            value={searchOposicion}
            onChange={(e) => setSearchOposicion(e.target.value)}
            className="search-input"
            allowClear
          />
          <RangePicker
            placeholder={['Fecha desde', 'Fecha hasta']}
            value={dateRange}
            onChange={(dates) => { setDateRange(dates); setCurrentPage(1); }}
            format="DD/MM/YYYY"
            className="date-range-picker"
          />
        </div>
      </Card>

      <Card className="table-card">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip="Cargando histórico..." />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="profesor_id"
            expandable={{ expandedRowRender }}
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total,
              showSizeChanger: false,
              onChange: (page) => setCurrentPage(page),
              showTotal: (t, range) => (
                <Text type="secondary">{range[0]}-{range[1]} de {t} profesores</Text>
              ),
            }}
            size="middle"
            className="admin-table"
          />
        )}
      </Card>

      {/* Modal guiado de exportación */}
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorBgContainer: '#ffffff',
            colorText: '#1a2332',
            colorTextSecondary: '#5a6678',
            colorBorder: '#d1d5db',
            colorPrimary: '#23C27B',
          },
        }}
      >
      <Modal
        title="Exportar histórico de revisiones"
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        onOk={runExport}
        okText="Exportar"
        cancelText="Cancelar"
        confirmLoading={exporting}
        okButtonProps={{
          icon: <DownloadOutlined />,
          disabled:
            loadingExportList ||
            exportCount === 0 ||
            (exportFormat === 'pdf' && exportSelectedIds.length === 0),
        }}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
          <div>
            <Text strong>1 · ¿Qué profesores quieres exportar?</Text>
            <Select
              mode="multiple"
              allowClear
              loading={loadingExportList}
              placeholder="Todos los profesores (o elige algunos)"
              style={{ width: '100%', marginTop: 10 }}
              value={exportSelectedIds}
              onChange={(vals) => setExportSelectedIds(vals as number[])}
              optionFilterProp="label"
              options={exportProfesores.map((p) => ({
                value: p.profesor_id,
                label: `${(p.profesor_nombre || '').trim() || `Profesor ${p.profesor_id}`} (${p.total_revisiones})`,
              }))}
            />
            <div style={{ marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {exportSelectedIds.length > 0
                  ? `Se exportarán ${exportCount} profesor(es).`
                  : exportFormat === 'pdf'
                    ? 'Para PDF debes elegir al menos un profesor.'
                    : `Déjalo vacío para exportar todos (${exportProfesores.length}).`}
              </Text>
            </div>
          </div>

          <div>
            <Text strong>2 · ¿En qué formato?</Text>
            <Radio.Group
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}
            >
              <Radio value="excel">
                <Space align="start">
                  <FileExcelOutlined style={{ color: '#1D6F42', fontSize: 18 }} />
                  <span>
                    <b>Excel</b><br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Una sola planilla con todas las revisiones. Ideal para analizar.
                    </Text>
                  </span>
                </Space>
              </Radio>
              <Radio value="pdf">
                <Space align="start">
                  <FilePdfOutlined style={{ color: '#C0392B', fontSize: 18 }} />
                  <span>
                    <b>PDF</b><br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Un archivo por profesor, con el logo de OpoRadar. Ideal para imprimir o compartir.
                    </Text>
                  </span>
                </Space>
              </Radio>
            </Radio.Group>
          </div>

          {exportFormat === 'pdf' && exportSelectedIds.length === 0 && (
            <Alert
              type="warning"
              showIcon
              message="Para exportar en PDF tienes que seleccionar al menos un profesor (no se puede exportar todos a la vez)."
            />
          )}
          {exportFormat === 'pdf' && exportSelectedIds.length > 1 && (
            <Alert
              type="info"
              showIcon
              message={`Se generarán ${exportSelectedIds.length} archivos PDF, uno por profesor (cada uno nombrado con su nombre).`}
            />
          )}
        </div>
      </Modal>
      </ConfigProvider>
    </div>
  );
};

export default AdminHistorico;
