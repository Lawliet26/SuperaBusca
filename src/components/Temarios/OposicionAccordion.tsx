import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, User } from 'lucide-react';
// import { EstadoTag } from './EstadoTag';
import { OposicionData } from '@/types';
import { useState } from 'react';
import { TemaTable } from './TemaTable';
import './Temarios.css';

interface OposicionAccordionProps {
  oposiciones: OposicionData[];
}

export const OposicionAccordion = ({ oposiciones }: OposicionAccordionProps) => {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };
  return (
      <div className="temarios-accordion">
        {Array.isArray(oposiciones) &&
            oposiciones.length > 0 &&
            oposiciones.map((oposicion, index) => {
          const isOpen = openId === oposicion.id_oposicion;

          return (
            <motion.div
            key={oposicion.id_oposicion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="oposicion-card"
            >
              <button
                className="oposicion-trigger"
                data-state={isOpen ? 'open' : 'closed'}
                onClick={() => toggleAccordion(oposicion.id_oposicion)}
                aria-expanded={isOpen}
              >
                <div className="oposicion-header-content">
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
                <ChevronDown className="oposicion-chevron" />
              </button>

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
    );
  };
