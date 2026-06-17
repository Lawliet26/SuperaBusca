import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../Layout/Header';
import Oposiciones from '../Oposiciones/Oposiciones';
import Revisiones from '../Revisiones/Revisiones';
import Correcciones from '../Correcciones/Correcciones';
import RevisionManual from '../RevisionManual/RevisionManual';
import './Dashboard.css';
import Temarios from '../Temarios/Temarios';
import AdminOposiciones from '../Admin/AdminOposicioness';
import { EventoHoyAlert } from '../shared/EventoHoyAlert';
import isotipo from '../../assets/logos/isotipo-verde.png'

const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const saved = localStorage.getItem('selectedPage');
    return saved || 'oposiciones';
  });

  useEffect(() => {
    localStorage.setItem('selectedPage', currentPage);
  }, [currentPage]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedPage' && e.newValue) {
        setCurrentPage(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'oposiciones':
        return <Oposiciones />;
      case 'revisiones':
        return <Revisiones />;
      case 'correcciones':
        return <Correcciones />;
      case 'revision-manual':
        return <RevisionManual />;
      case 'misconvocatorias':
        return <Temarios />;
      case 'admin':
        return <AdminOposiciones />;
      default:
        return <Oposiciones />;
    }
  };

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <EventoHoyAlert onIrAConvocatorias={() => setCurrentPage('misconvocatorias')} />
      <div className="isotipo-container">
        <img src={isotipo} alt="isotipo" className='isotipo' />
      </div>
      <main className="dashboard-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="page-container"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  );
};

export default Dashboard;
