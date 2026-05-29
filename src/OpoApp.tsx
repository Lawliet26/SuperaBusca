import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import MantenimientoPage from './components/Mantenimiento/MantenimientoPage';
import MantenimientoBanner from './components/Mantenimiento/MantenimientoBanner';
import { NotificationIsland } from './components/shared/NotificationIsland';
import { useMantenimiento } from './hooks/useMantenimiento';
import './styles/global.css';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { estado, loading, isActivo, isProximo, refresh } = useMantenimiento();

  if (!loading && isActivo && estado) {
    return <MantenimientoPage estado={estado} onRefresh={refresh} />;
  }

  return (
    <>
      {isProximo && estado && <MantenimientoBanner estado={estado} />}
      <NotificationIsland />
      <AnimatePresence mode="wait">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </AnimatePresence>
    </>
  );
};

const OpoApp: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1E3A5F',
          colorBgContainer: '#0b192e',
          colorBorder: 'rgba(255, 255, 255, 0.1)',
          colorText: '#F0F5FF',
          colorTextSecondary: '#94a3b8',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Button: {
            primaryShadow: '0 4px 16px rgba(30, 58, 95, 0.4)',
          },
          Input: {
            activeBorderColor: '#1E3A5F',
            hoverBorderColor: '#D0E4F7',
            colorBgContainer: '#0b192e',
          },
          Select: {
            optionSelectedBg: 'rgba(30, 58, 95, 0.4)',
          },
          Modal: {
            contentBg: '#ffffff',
            headerBg: '#ffffff',
            titleColor: '#1a2332',
            colorText: '#1a2332',
            colorIcon: '#1a2332',
            colorIconHover: '#1E3A5F',
          },
        },
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConfigProvider>
  );
};

export default OpoApp;
