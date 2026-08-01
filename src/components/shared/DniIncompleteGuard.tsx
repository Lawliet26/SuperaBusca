import { useEffect, useState } from 'react';
import { Modal, Button } from 'antd';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Guard visual para estudiantes con información incompleta (sin DNI):
 *  1. Al entrar, muestra un modal grande de advertencia.
 *  2. Mientras falte el DNI, tiñe las esquinas de la plataforma de amarillo muy
 *     suave (sin bloquear la navegación) como recordatorio de que algo falta.
 *
 * No bloquea la navegación: el bloqueo de acciones (pedir temario / descargar)
 * se hace en cada acción concreta.
 */
export const DniIncompleteGuard = () => {
  const { user, isProfesor, isAdmin } = useAuth();
  const esEstudiante = !!user && !isProfesor && !isAdmin;
  const faltaDni = esEstudiante && !user?.dni;

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (faltaDni) setModalOpen(true);
  }, [faltaDni]);

  if (!faltaDni) return null;

  const linea = (user?.company_organization || '').toLowerCase() === 'patrio' ? 'Patrio' : 'Supera';

  return (
    <>
      {/* Tinte amarillo pegado a los bordes, con animación suave de "respiración" */}
      <div className="dni-corner-glow" />
      <style>{`
        @keyframes dniCornerPulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }
        .dni-corner-glow {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 900;
          box-shadow: inset 0 0 70px 0 rgba(234, 179, 8, 0.55);
          border: 3px solid rgba(234, 179, 8, 0.55);
          animation: dniCornerPulse 2.6s ease-in-out infinite;
        }
      `}</style>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        centered
        width={520}
        maskClosable={false}
        footer={[
          <Button key="ok" type="primary" onClick={() => setModalOpen(false)}>
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
            No tenemos registrado tu <strong>DNI</strong>. Puedes seguir navegando la plataforma con
            normalidad, pero <strong>no podrás solicitar temarios ni descargar recursos</strong>{' '}
            hasta que se cargue.
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
