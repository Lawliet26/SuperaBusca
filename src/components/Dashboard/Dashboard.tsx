import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../Layout/Header';
import Oposiciones from '../Oposiciones/Oposiciones';
import Revisiones from '../Revisiones/Revisiones';
import Correcciones from '../Correcciones/Correcciones';
import './Dashboard.css';
import Temarios from '../Temarios/Temarios';

const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('oposiciones');

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
      case 'misconvocatorias':
        return <Temarios />;
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
