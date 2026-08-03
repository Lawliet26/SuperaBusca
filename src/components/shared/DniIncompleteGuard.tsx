import { useEffect, useState } from 'react';
import { Modal, Button } from 'antd';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * Aviso para estudiantes con información incompleta (sin DNI).
 * Muestra un modal informativo al entrar. NO bloquea la plataforma: mientras no
 * haya DNI, los documentos se marcan con el correo como identificación provisional.
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
  );
};

export default DniIncompleteGuard;
