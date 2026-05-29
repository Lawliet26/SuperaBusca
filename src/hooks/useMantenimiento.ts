import { useState, useEffect, useCallback } from 'react';
import { MantenimientoEstado, mantenimientoService } from '../services/mantenimientoService';

const POLL_INTERVAL  = 5 * 60 * 1000; // re-fetch API cada 5 min
const TICK_INTERVAL  = 30 * 1000;     // re-evalúa fechas cada 30 seg

export const useMantenimiento = () => {
  const [estado, setEstado] = useState<MantenimientoEstado | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick]   = useState(0); // fuerza re-render para actualizar "now"

  const check = useCallback(async () => {
    const data = await mantenimientoService.getEstado();
    setEstado(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    check();
    const poll = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [check]);

  // Ticker independiente: re-evalúa isActivo/isProximo cada 30 segundos
  useEffect(() => {
    const ticker = setInterval(() => setTick(n => n + 1), TICK_INTERVAL);
    return () => clearInterval(ticker);
  }, []);

  // Comparación directa UTC — las fechas en DB ya vienen con Z (UTC correcto)
  const now    = new Date();
  const inicio = estado?.fecha_inicio ? new Date(estado.fecha_inicio) : null;
  const fin    = estado?.fecha_fin    ? new Date(estado.fecha_fin)    : null;

  const isActivo =
    estado?.activo === true ||
    (inicio !== null && fin !== null && now >= inicio && now <= fin);

  const isProximo = !isActivo && inicio !== null && inicio > now;

  // tick se usa solo para que React re-evalúe las líneas de arriba
  void tick;

  return { estado, loading, isActivo, isProximo, refresh: check };
};
