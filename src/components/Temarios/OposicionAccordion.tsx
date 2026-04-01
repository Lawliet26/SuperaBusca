import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, User } from 'lucide-react';
import { OposicionData } from '@/types';
import { useState } from 'react';
import { TemaTable } from './TemaTable';
import { RecursosModal } from './RecursosModal';
import './Temarios.css';
import { Button } from 'antd';

interface OposicionAccordionProps {
  oposiciones: OposicionData[];
}

// ACCORDION_DISABLED: inhabilitar el dropdown hasta nuevo aviso — solo el botón "Ver Recursos" permanece activo
const ACCORDION_DISABLED = true;

export const OposicionAccordion = ({ oposiciones }: OposicionAccordionProps) => {
  const [openId, setOpenId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOposicion, setSelectedOposicion] = useState<OposicionData | null>(null);

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  const handleVerRecursos = (oposicion: OposicionData, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOposicion(oposicion);
    setModalOpen(true);
  };

  return (
    <>
      <div className="temarios-accordion">
        {Array.isArray(oposiciones) &&
          oposiciones.length > 0 &&
          oposiciones.map((oposicion, index) => {
            const isOpen = !ACCORDION_DISABLED && openId === oposicion.id_oposicion;
            const isDisabled = ACCORDION_DISABLED || oposicion.manual === true;

            return (
              <motion.div
                key={oposicion.id_oposicion}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`oposicion-card-accordion${isDisabled ? ' oposicion-card-disabled' : ''}`}
              >
                <div className="oposicion-trigger" data-state={isOpen ? 'open' : 'closed'}>
                  <button
                    className="oposicion-trigger-clickable"
                    onClick={() => !isDisabled && toggleAccordion(oposicion.id_oposicion)}
                    aria-expanded={isOpen}
                    style={isDisabled ? { cursor: 'not-allowed', opacity: 0.5, flex: 1, background: 'none', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } : { flex: 1, background: 'none', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div>
                      <h3 className="oposicion-title">
                        {oposicion.titulo_oposicion}
                      </h3>
                      <div className="oposicion-meta">
                        <span className="oposicion-user">
                          <User className="oposicion-user-icon" />
                          Sistema de detección
                        </span>
                      </div>
                    </div>
                    {/* <ChevronDown className="oposicion-chevron" /> */}
                  </button>

                  <Button
                    size="large"
                    onClick={(e) => handleVerRecursos(oposicion, e)}
                  >
                    Ver Recursos
                  </Button>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="oposicion-content">
                        <TemaTable temas={oposicion.temario} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
      </div>

      {selectedOposicion && (
        <RecursosModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          oposicionId={selectedOposicion.id_oposicion}
          tituloOposicion={selectedOposicion.titulo_oposicion}
        />
      )}
    </>
  );
};