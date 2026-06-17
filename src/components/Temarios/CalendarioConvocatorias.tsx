import { useState, useEffect, useMemo } from 'react';
import { Spin, Empty, Typography, Button } from 'antd';
import {
  CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined,
  LeftOutlined, RightOutlined, FolderOpenOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { actividadesService, Actividad } from '@/services/actividadesService';
import { RecursosModal } from './RecursosModal';
import './CalendarioConvocatorias.css';

const { Text } = Typography;

const TIPO_LABEL: Record<string, string> = {
  reunion: 'Reunión',
  actividad: 'Actividad',
  fecha_especial: 'Fecha especial',
  otro: 'Otro',
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface Convocatoria {
  id_oposicion: number;
  titulo_oposicion: string;
}

interface Props {
  convocatorias: Convocatoria[];
}

export const CalendarioConvocatorias = ({ convocatorias }: Props) => {
  const [selectedId, setSelectedId] = useState<number | null>(convocatorias[0]?.id_oposicion ?? null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<Dayjs>(dayjs());
  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null);
  const [recursosConv, setRecursosConv] = useState<Convocatoria | null>(null);

  useEffect(() => {
    if (selectedId == null) { setActividades([]); return; }
    let cancel = false;
    setLoading(true);
    actividadesService.list({ oposicion_id: selectedId })
      .then((data) => {
        if (cancel) return;
        setActividades(data);
        const first = data.find((a) => a.fecha_inicio);
        if (first?.fecha_inicio) setCursor(dayjs(first.fecha_inicio).startOf('month'));
        setSelectedDay(null);
      })
      .catch(() => { if (!cancel) setActividades([]); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [selectedId]);

  const porDia = useMemo(() => {
    const m: Record<string, Actividad[]> = {};
    actividades.forEach((a) => {
      if (a.fecha_inicio) {
        const k = dayjs(a.fecha_inicio).format('YYYY-MM-DD');
        (m[k] = m[k] || []).push(a);
      }
    });
    return m;
  }, [actividades]);

  // Grilla del mes (semana de lunes a domingo, 6 filas)
  const dias = useMemo(() => {
    const inicioMes = cursor.startOf('month');
    const offset = (inicioMes.day() + 6) % 7; // días desde el lunes
    const inicioGrilla = inicioMes.subtract(offset, 'day');
    return Array.from({ length: 42 }, (_, i) => inicioGrilla.add(i, 'day'));
  }, [cursor]);

  const eventosDelDia = selectedDay ? (porDia[selectedDay.format('YYYY-MM-DD')] || []) : [];
  const selected = convocatorias.find((c) => c.id_oposicion === selectedId);
  const hoy = dayjs();

  return (
    <div className="cal-layout">
      {/* Izquierda: lista de convocatorias */}
      <div className="cal-list">
        <div className="cal-list-title">Mis convocatorias</div>
        {convocatorias.map((c) => (
          <div
            key={c.id_oposicion}
            className={`cal-list-item${c.id_oposicion === selectedId ? ' active' : ''}`}
          >
            <button className="cal-list-item-main" onClick={() => setSelectedId(c.id_oposicion)}>
              <CalendarOutlined className="cal-list-icon" />
              <span>{c.titulo_oposicion}</span>
            </button>
            <Button size="small" block icon={<FolderOpenOutlined />} onClick={() => setRecursosConv(c)}>
              Ver Recursos
            </Button>
          </div>
        ))}
      </div>

      {/* Derecha: calendario */}
      <div className="cal-panel">
        {selectedId == null ? (
          <Empty description="Selecciona una convocatoria" />
        ) : loading ? (
          <div className="cal-loading"><Spin size="large" /></div>
        ) : (
          <>
            <div className="cal-panel-header">
              <h3>{selected?.titulo_oposicion}</h3>
              {actividades.length === 0 && (
                <Text type="secondary">Esta convocatoria no tiene actividades programadas.</Text>
              )}
            </div>

            <div className="mcal">
              <div className="mcal-header">
                <button className="mcal-nav" onClick={() => setCursor((c) => c.subtract(1, 'month'))}>
                  <LeftOutlined />
                </button>
                <div className="mcal-title">{MESES[cursor.month()]} {cursor.year()}</div>
                <button className="mcal-nav" onClick={() => setCursor((c) => c.add(1, 'month'))}>
                  <RightOutlined />
                </button>
              </div>

              <div className="mcal-grid mcal-weekdays">
                {WEEKDAYS.map((w) => <div key={w} className="mcal-wd">{w}</div>)}
              </div>

              <div className="mcal-grid">
                {dias.map((d) => {
                  const key = d.format('YYYY-MM-DD');
                  const evs = porDia[key] || [];
                  const otherMonth = d.month() !== cursor.month();
                  const isToday = d.isSame(hoy, 'day');
                  const isSel = selectedDay ? d.isSame(selectedDay, 'day') : false;
                  return (
                    <button
                      key={key}
                      className={`mcal-day${otherMonth ? ' other' : ''}${isToday ? ' today' : ''}${isSel ? ' sel' : ''}`}
                      onClick={() => setSelectedDay(d)}
                    >
                      <span className="mcal-num">{d.date()}</span>
                      {evs.length > 0 && (
                        <span className="mcal-dots">
                          {evs.slice(0, 3).map((e, i) => (
                            <span key={i} className="mcal-dot" style={{ background: e.color || '#23C27B' }} />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDay && (
              <div className="cal-day-events">
                <div className="cal-day-title">{selectedDay.format('DD/MM/YYYY')}</div>
                {eventosDelDia.length === 0 ? (
                  <Text type="secondary">Sin eventos este día.</Text>
                ) : (
                  eventosDelDia.map((e) => (
                    <div key={e.id} className="cal-day-card" style={{ borderLeft: `4px solid ${e.color || '#23C27B'}` }}>
                      <div className="cal-day-card-title">
                        {e.titulo || 'Actividad'}
                        {e.tipo && <span className="cal-tipo">{TIPO_LABEL[e.tipo] || e.tipo}</span>}
                      </div>
                      {e.descripcion && <div className="cal-day-card-desc">{e.descripcion}</div>}
                      <div className="cal-day-card-meta">
                        <span>
                          <ClockCircleOutlined />{' '}
                          {dayjs(e.fecha_inicio).format(e.todo_el_dia ? 'DD/MM/YYYY' : 'HH:mm')}
                          {e.fecha_fin ? ` - ${dayjs(e.fecha_fin).format(e.todo_el_dia ? 'DD/MM/YYYY' : 'HH:mm')}` : ''}
                        </span>
                        {e.ubicacion && <span><EnvironmentOutlined /> {e.ubicacion}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {recursosConv && (
        <RecursosModal
          isOpen={!!recursosConv}
          onClose={() => setRecursosConv(null)}
          oposicionId={recursosConv.id_oposicion}
          tituloOposicion={recursosConv.titulo_oposicion}
        />
      )}
    </div>
  );
};

export default CalendarioConvocatorias;
