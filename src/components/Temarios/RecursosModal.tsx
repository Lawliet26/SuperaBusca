import { AnimatePresence, motion } from 'framer-motion';
import { X, FileText, Image, Video, Headphones, ExternalLink, Download } from 'lucide-react';
import { Modal, Spin } from 'antd';
import { notify } from '@/utils/notify';
import { useEffect, useState } from 'react';
import './RecursosModal.css';
import { recursosService } from '@/services/recursosService';

interface Recurso {
    titulo: string;
    url: string;
    mimetype: string;
    tipo: 'link' | 'audio' | 'video' | 'documento' | 'image';
}

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
    const [recursos, setRecursos] = useState<Recurso[]>([]);
    const [loading, setLoading] = useState(false);

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

    const handleRecursoClick = (recurso: Recurso) => {
        window.open(recurso.url, '_blank', 'noopener,noreferrer');
    };

    return (
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
                        <Spin size="large" tip="Cargando correcciones..." />
                    </div>
                ) : (
                    <div className="recursos-grid">
                        <AnimatePresence>
                            {recursos.map((recurso, index) => (
                                <motion.div
                                    key={index}
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

                                    <div className="recurso-action">
                                        <Download className="recurso-action-icon" />
                                    </div>
                                </motion.div>
                            ))}
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
    );
};