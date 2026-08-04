import { useEffect, useState } from 'react';
import { Modal, Button } from 'antd';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Cuánto tiempo se silencia el aviso después de "Entendido" (un buen rato).
const SNOOZE_KEY = 'dni_alert_snooze_until';
const SNOOZE_MS = 3 * 60 * 60 * 1000; // 3 horas

/**
 * Aviso para estudiantes sin DNI:
 *  - Aparece como una notificación (toast) arriba a la derecha.
 *  - Al hacer clic se expande en un modal con toda la info.
 *  - Con "Entendido" se silencia por un buen rato (no vuelve a molestar).
 * No bloquea la plataforma: mientras no haya DNI, los documentos se marcan con el correo.
 */
export const DniIncompleteGuard = () => {
  const { user, isProfesor, isAdmin } = useAuth();
  const esEstudiante = !!user && !isProfesor && !isAdmin;
  const faltaDni = esEstudiante && !user?.dni;

  const [modalOpen, setModalOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!faltaDni) {
      setVisible(false);
      return;
    }
    const until = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    setVisible(Date.now() >= until);
  }, [faltaDni]);

  if (!faltaDni) return null;

  const linea = (user?.company_organization || '').toLowerCase() === 'patrio' ? 'Patrio' : 'Supera';

  // "Entendido" / cerrar el toast → silenciar por un rato.
  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    setModalOpen(false);
    setVisible(false);
  };

  return (
    <>
      {visible && !modalOpen && (
        <>
          <div
            className="dni-toast"
            role="button"
            onClick={() => setModalOpen(true)}
          >
            <div className="dni-toast-icon">
              <AlertTriangle size={20} color="#ca8a04" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#1a2332', fontSize: 14 }}>Te falta tu DNI</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>Toca para ver los detalles</div>
            </div>
            <button
              type="button"
              className="dni-toast-close"
              onClick={(e) => {
                e.stopPropagation();
                snooze();
              }}
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
          <style>{`
            @keyframes dniToastIn {
              from { opacity: 0; transform: translateX(24px); }
              to { opacity: 1; transform: translateX(0); }
            }
            .dni-toast {
              position: fixed;
              top: 84px;
              right: 20px;
              z-index: 950;
              display: flex;
              align-items: center;
              gap: 10px;
              width: 300px;
              max-width: calc(100vw - 40px);
              padding: 12px 12px 12px 14px;
              background: #fff;
              border-left: 4px solid #f59e0b;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.28);
              cursor: pointer;
              animation: dniToastIn 0.35s ease-out;
              transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            .dni-toast:hover {
              transform: translateY(-2px);
              box-shadow: 0 14px 36px rgba(0,0,0,0.34);
            }
            .dni-toast-icon {
              width: 38px;
              height: 38px;
              flex-shrink: 0;
              border-radius: 50%;
              background: #fef9c3;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .dni-toast-close {
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 26px;
              height: 26px;
              border: none;
              background: transparent;
              color: #94a3b8;
              border-radius: 6px;
              cursor: pointer;
            }
            .dni-toast-close:hover { background: #f1f5f9; color: #475569; }
          `}</style>
        </>
      )}

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        centered
        width={520}
        maskClosable
        footer={[
          <Button key="ok" type="primary" onClick={snooze}>
            Entendido
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: '12px 8px' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fef9c3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <AlertTriangle size={34} color="#ca8a04" />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#1a2332' }}>
            Te falta información
          </h2>
          <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.55, margin: 0 }}>
            No tenemos registrado tu <strong>DNI</strong>. Puedes seguir usando la plataforma con
            normalidad.
          </p>
          <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.55, margin: '12px 0 0' }}>
            Como medida de seguridad, mientras tanto los documentos que descargues se marcarán con tu{' '}
            <strong>correo</strong>. Cuando se registre tu DNI, la marca de agua pasará a usarlo.
          </p>
          <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.55, margin: '12px 0 0' }}>
            Comunícate con el equipo de <strong>{linea}</strong> para completar tus datos.
          </p>
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              background: '#fef9c3',
              border: '1px solid #fde68a',
              borderRadius: 10,
              color: '#854d0e',
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            ¿Ya tienes todo listo? <strong>Cierra sesión y vuelve a iniciar</strong> para que se
            actualice tu información.
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DniIncompleteGuard;
