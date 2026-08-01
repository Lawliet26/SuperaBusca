import { useRef, useState } from 'react';
import { Modal, Button, Tooltip, Spin } from 'antd';
import {
  X,
  FileText,
  Eye,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Video,
  Headphones,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { recursosService } from '@/services/recursosService';
import { watermarkPdf, descargarBytesPdf, bytesToBlobUrl } from '@/utils/pdfWatermark';
import { notify } from '@/utils/notify';
import { RecursoGet } from '@/types';

const ICONO: Record<string, JSX.Element> = {
  documento: <FileText size={18} />,
  image: <ImageIcon size={18} />,
  video: <Video size={18} />,
  audio: <Headphones size={18} />,
  link: <ExternalLink size={18} />,
};

const LABEL: Record<string, string> = {
  documento: 'Documento',
  image: 'Imagen',
  video: 'Video',
  audio: 'Audio',
  link: 'Enlace',
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #e5e7eb',
  borderLeft: '4px solid #23C27B',
  borderRadius: 10,
  padding: '12px 14px',
  background: '#fff',
  color: '#1a2332',
  textDecoration: 'none',
};

/**
 * Renderiza un recurso de la oposición.
 * - Si es un DOCUMENTO protegido (el backend ocultó la URL al estudiante),
 *   muestra "Ver" (overlay con marca de agua) y "Descargar" (PDF watermarkeado
 *   con el DNI del estudiante). El PDF crudo se baja por el proxy, se marca en
 *   el navegador y recién ahí se muestra/descarga.
 * - Si es un enlace externo (link/video/etc. con URL), lo abre normal.
 */
export const RecursoDescargable = ({ recurso }: { recurso: RecursoGet }) => {
  const { user } = useAuth();
  const dni = user?.dni || null;
  const [loading, setLoading] = useState(false);
  const [visorUrl, setVisorUrl] = useState<string | null>(null);
  const bytesRef = useRef<Uint8Array | null>(null);

  // Documento protegido = tipo documento SIN url (el backend la ocultó al estudiante).
  const esProtegido = recurso.tipo === 'documento' && !recurso.url;
  const sinDni = !dni;

  const asegurarWatermarked = async (): Promise<Uint8Array> => {
    if (bytesRef.current) return bytesRef.current;
    const raw = await recursosService.descargarRecursoBytes(recurso.id!);
    const wm = await watermarkPdf(raw, dni || '');
    bytesRef.current = wm;
    return wm;
  };

  const handleVer = async () => {
    setLoading(true);
    try {
      const wm = await asegurarWatermarked();
      setVisorUrl(bytesToBlobUrl(wm));
    } catch {
      notify.error(sinDni ? 'Necesitas cargar tu DNI para ver este recurso' : 'No se pudo abrir el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = async () => {
    setLoading(true);
    try {
      const wm = await asegurarWatermarked();
      descargarBytesPdf(wm, recurso.titulo || 'recurso');
    } catch {
      notify.error(sinDni ? 'Necesitas cargar tu DNI para descargar' : 'No se pudo descargar el documento');
    } finally {
      setLoading(false);
    }
  };

  const cerrarVisor = () => {
    if (visorUrl) URL.revokeObjectURL(visorUrl);
    setVisorUrl(null);
  };

  // Recurso NO protegido (enlace externo con URL): se abre directo.
  if (!esProtegido) {
    if (!recurso.url) return null;
    return (
      <a href={recurso.url} target="_blank" rel="noopener noreferrer" style={cardStyle}>
        <span style={{ color: '#23C27B', display: 'flex' }}>{ICONO[recurso.tipo] || <FileText size={18} />}</span>
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {recurso.titulo}
          </span>
          <span style={{ color: '#64748b', fontSize: 12 }}>{LABEL[recurso.tipo] || 'Recurso'}</span>
        </span>
      </a>
    );
  }

  return (
    <>
      <div style={cardStyle}>
        <span style={{ color: '#23C27B', display: 'flex' }}>{ICONO.documento}</span>
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {recurso.titulo}
          </span>
          <span style={{ color: '#64748b', fontSize: 12 }}>Documento</span>
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {loading && <Spin size="small" />}
          <Tooltip title={sinDni ? 'Carga tu DNI para ver' : 'Ver'}>
            <button
              type="button"
              disabled={sinDni || loading}
              onClick={handleVer}
              style={btnStyle(sinDni || loading)}
            >
              <Eye size={16} />
            </button>
          </Tooltip>
          <Tooltip title={sinDni ? 'Carga tu DNI para descargar' : 'Descargar con marca de agua'}>
            <button
              type="button"
              disabled={sinDni || loading}
              onClick={handleDescargar}
              style={btnStyle(sinDni || loading)}
            >
              <Download size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      <Modal
        open={!!visorUrl}
        onCancel={cerrarVisor}
        footer={null}
        width="82vw"
        title={recurso.titulo}
        closeIcon={<X />}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ height: '78vh', background: '#525659' }}>
          {visorUrl && (
            <iframe
              src={visorUrl}
              title={recurso.titulo}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px' }}>
          <Button type="primary" icon={<Download size={16} />} onClick={handleDescargar} loading={loading}>
            Descargar
          </Button>
        </div>
      </Modal>
    </>
  );
};

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 8,
  border: '1px solid #d1fae5',
  background: disabled ? '#f1f5f9' : '#ecfdf5',
  color: disabled ? '#94a3b8' : '#059669',
  cursor: disabled ? 'not-allowed' : 'pointer',
});

export default RecursoDescargable;
