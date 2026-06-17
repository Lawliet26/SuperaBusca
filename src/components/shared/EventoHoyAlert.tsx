import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '@/context/AuthContext';
import { temariosService } from '@/services/temariosService';
import { actividadesService, Actividad } from '@/services/actividadesService';
import './EventoHoyAlert.css';

interface Props {
  onIrAConvocatorias: () => void;
}

/**
 * Aviso global: si HOY hay alguna actividad de las convocatorias del usuario,
 * muestra una estela verde pulsante en los bordes de la página + un cartel.
 */
export const EventoHoyAlert = ({ onIrAConvocatorias }: Props) => {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<Actividad[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    if (sessionStorage.getItem('evento_hoy_dismiss') === dayjs().format('YYYY-MM-DD')) return;

    let cancel = false;
    (async () => {
      try {
        const convs = await temariosService.getMisTemarios(user);
        const ids = new Set((Array.isArray(convs) ? convs : []).map((c: any) => c.id_oposicion));
        if (!ids.size) return;

        const acts = await actividadesService.list({
          fecha_inicio: dayjs().startOf('day').toISOString(),
          fecha_fin: dayjs().endOf('day').toISOString(),
        });
        const mios = acts.filter((a) => a.oposicion_id != null && ids.has(a.oposicion_id));
        if (!cancel && mios.length > 0) {
          setEventos(mios);
          setVisible(true);
        }
      } catch {
        /* silencioso: el aviso es no crítico */
      }
    })();
    return () => { cancel = true; };
  }, [user?.id]);

  const cerrar = () => {
    setVisible(false);
    sessionStorage.setItem('evento_hoy_dismiss', dayjs().format('YYYY-MM-DD'));
  };

  if (!visible) return null;

  return (
    <>
      <div className="evento-hoy-glow" aria-hidden="true" />
      <div className="evento-hoy-banner" role="alert">
        <span className="evento-hoy-icon">🔔</span>
        <div className="evento-hoy-text">
          <strong>
            {eventos.length === 1 ? 'Tienes un evento hoy' : `Tienes ${eventos.length} eventos hoy`}
          </strong>
          <span>Revisa "Mis Convocatorias" para ver el detalle.</span>
        </div>
        <button
          className="evento-hoy-btn"
          onClick={() => { onIrAConvocatorias(); cerrar(); }}
        >
          Ver
        </button>
        <button className="evento-hoy-close" onClick={cerrar} aria-label="Cerrar aviso">✕</button>
      </div>
    </>
  );
};

export default EventoHoyAlert;
