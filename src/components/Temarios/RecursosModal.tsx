import { AnimatePresence, motion } from 'framer-motion';
import { X, FileText, Image, Video, Headphones, ExternalLink, Download, Eye } from 'lucide-react';
import { Modal, Spin, Tooltip } from 'antd';
import { notify } from '@/utils/notify';
import { useEffect, useRef, useState } from 'react';
import './RecursosModal.css';
import { recursosService } from '@/services/recursosService';
import { RecursoGet } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { watermarkPdf, descargarBytesPdf, bytesToBlobUrl } from '@/utils/pdfWatermark';

interface RecursosModalProps {
    isOpen: boolean;
    onClose: () => void;
    oposicionId: number;
    tituloOposicion: string;
}

export const RecursosModal = ({
    isOpen,
    onClose,
    oposicionId,
    tituloOposicion
}: RecursosModalProps) => {
    const { user } = useAuth();
    // Marca de agua: DNI si existe; si no, el correo como identificación provisional.
    const marca = user?.dni || user?.username || '';

    const [recursos, setRecursos] = useState<RecursoGet[]>([]);
    const [loading, setLoading] = useState(false);
    const [visorUrl, setVisorUrl] = useState<string | null>(null);
    const [visorTitulo, setVisorTitulo] = useState('');
    const [busyId, setBusyId] = useState<number | null>(null);
    const cacheRef = useRef<Record<number, Uint8Array>>({});

    useEffect(() => {
        if (isOpen && oposicionId) {
            fetchRecursos();
        }
    }, [isOpen, oposicionId]);

    const fetchRecursos = async () => {
        setLoading(true);
        try {
            const data = await recursosService.getRecursosByOposicion(oposicionId);
            setRecursos(data);
        } catch (error) {
            console.error('Error al cargar recursos:', error);
            notify.error('Error al cargar los recursos. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Documento protegido = el backend le ocultó la URL de Drive al estudiante.
    const esProtegido = (r: RecursoGet) => r.tipo === 'documento' && !r.url;

    const asegurarWatermarked = async (recurso: RecursoGet): Promise<Uint8Array> => {
        const id = recurso.id!;
        if (cacheRef.current[id]) return cacheRef.current[id];
        const raw = await recursosService.descargarRecursoBytes(id);
        const wm = await watermarkPdf(raw, marca);
        cacheRef.current[id] = wm;
        return wm;
    };

    const verDocumento = async (recurso: RecursoGet) => {
        setBusyId(recurso.id!);
        try {
            const wm = await asegurarWatermarked(recurso);
            setVisorTitulo(recurso.titulo);
            setVisorUrl(bytesToBlobUrl(wm));
        } catch {
            notify.error('No se pudo abrir el documento');
        } finally {
            setBusyId(null);
        }
    };

    const descargarDocumento = async (recurso: RecursoGet) => {
        setBusyId(recurso.id!);
        try {
            const wm = await asegurarWatermarked(recurso);
            descargarBytesPdf(wm, recurso.titulo || 'recurso');
        } catch {
            notify.error('No se pudo descargar el documento');
        } finally {
            setBusyId(null);
        }
    };

    const cerrarVisor = () => {
        if (visorUrl) URL.revokeObjectURL(visorUrl);
        setVisorUrl(null);
    };

    const getIconByType = (tipo: string) => {
        switch (tipo) {
            case 'documento':
                return <FileText className="recurso-icon" />;
            case 'image':
                return <Image className="recurso-icon" />;
            case 'video':
                return <Video className="recurso-icon" />;
            case 'audio':
                return <Headphones className="recurso-icon" />;
            case 'link':
                return <ExternalLink className="recurso-icon" />;
            default:
                return <FileText className="recurso-icon" />;
        }
    };

    const getColorByType = (tipo: string) => {
        switch (tipo) {
            case 'documento':
                return 'recurso-card-documento';
            case 'image':
                return 'recurso-card-imagen';
            case 'video':
                return 'recurso-card-video';
            case 'audio':
                return 'recurso-card-audio';
            case 'link':
                return 'recurso-card-link';
            default:
                return 'recurso-card-default';
        }
    };

    const getTipoLabel = (tipo: string) => {
        switch (tipo) {
            case 'documento':
                return 'Documento';
            case 'image':
                return 'Imagen';
            case 'video':
                return 'Video';
            case 'audio':
                return 'Audio';
            case 'link':
                return 'Enlace';
            default:
                return 'Recurso';
        }
    };

    const handleRecursoClick = (recurso: RecursoGet) => {
        if (esProtegido(recurso)) {
            verDocumento(recurso);
            return;
        }
        if (recurso.url) window.open(recurso.url, '_blank', 'noopener,noreferrer');
    };

    const iconBtn: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: 8,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
    };

    return (
        <>
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={800}
            className="recursos-modal"
            closeIcon={<X />}
        >
            <div className="recursos-modal-content">
                <div className="recursos-modal-header">
                    <h2>Recursos Disponibles</h2>
                    <p className="recursos-modal-subtitle">{tituloOposicion}</p>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <Spin size="large" tip="Cargando recursos..." />
                    </div>
                ) : (
                    <div className="recursos-grid">
                        <AnimatePresence>
                            {recursos.map((recurso, index) => {
                                const protegido = esProtegido(recurso);
                                const busy = busyId === recurso.id;
                                return (
                                <motion.div
                                    key={recurso.id ?? index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`recurso-card ${getColorByType(recurso.tipo)}`}
                                    onClick={() => handleRecursoClick(recurso)}
                                >
                                    <div className="recurso-icon-container">
                                        {getIconByType(recurso.tipo)}
                                    </div>

                                    <div className="recurso-content">
                                        <h3 className="recurso-titulo">{recurso.titulo}</h3>
                                        <span className="recurso-tipo-badge">
                                            {getTipoLabel(recurso.tipo)}
                                        </span>
                                    </div>

                                    <div className="recurso-action" onClick={(e) => e.stopPropagation()}>
                                        {protegido ? (
                                            <>
                                                {busy && <Spin size="small" />}
                                                <Tooltip title="Ver">
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => verDocumento(recurso)}
                                                        style={{ ...iconBtn, color: '#059669', cursor: busy ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip title="Descargar con marca de agua">
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => descargarDocumento(recurso)}
                                                        style={{ ...iconBtn, color: '#059669', cursor: busy ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                </Tooltip>
                                            </>
                                        ) : (
                                            <Download className="recurso-action-icon" />
                                        )}
                                    </div>
                                </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {!loading && recursos.length === 0 && (
                            <div className="recursos-empty">
                                <FileText size={48} />
                                <p>No hay recursos disponibles para esta oposición</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>

        <Modal
            open={!!visorUrl}
            onCancel={cerrarVisor}
            footer={null}
            width="82vw"
            title={visorTitulo}
            closeIcon={<X />}
            styles={{ body: { padding: 0 } }}
        >
            <div style={{ height: '78vh', background: '#525659' }}>
                {visorUrl && (
                    <iframe src={visorUrl} title={visorTitulo} style={{ width: '100%', height: '100%', border: 'none' }} />
                )}
            </div>
        </Modal>
        </>
    );
};
