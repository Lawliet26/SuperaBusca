import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dropdown, Avatar, Tooltip } from 'antd';
import {
  LogoutOutlined,
  BookOutlined,
  FileSearchOutlined,
  EditOutlined,
  SnippetsOutlined,
  UserOutlined,
  AuditOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import './Header.css';
import isotipo from '../../assets/logos/isotipo-verde.png';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user, logout, isProfesor, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      // Dirección del scroll: bajando -> compacto; subiendo o cerca del top -> tamaño normal
      if (y < 60) setCompact(false);
      else if (y > lastY + 4) setCompact(true);
      else if (y < lastY - 4) setCompact(false);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { key: 'oposiciones', label: 'Oposiciones', icon: <BookOutlined />, visible: true },
    { key: 'revisiones', label: 'Revisiones', icon: <FileSearchOutlined />, visible: false },
    { key: 'correcciones', label: 'Correcciones', icon: <EditOutlined />, visible: false },
    { key: 'revision-manual', label: 'Revisión Manual', icon: <AuditOutlined />, visible: isProfesor || isAdmin },
    { key: 'misconvocatorias', label: 'Mis Convocatorias', icon: <SnippetsOutlined />, visible: true },
    { key: 'admin', label: 'Administrador', icon: <EditOutlined />, visible: isAdmin || isProfesor },
  ].filter(item => item.visible);

  const rolLabel = user?.rol === 'PROFESOR' ? 'Profesor' : user?.rol === 'ESTUDIANTE' ? 'Estudiante' : 'Admin';
  const rolColor = user?.rol === 'PROFESOR' ? '#23C27B' : user?.rol === 'ESTUDIANTE' ? '#DFF5EC' : '#ef4444';

  const userPanel = (
    <div className="user-panel">
      <div className="user-panel-header">
        <div className="user-panel-info">
          <span className="user-panel-name">{user?.nombre}</span>
          <span className="user-panel-email">{user?.username}</span>
          <span className="user-panel-role" style={{ color: rolColor, borderColor: rolColor }}>
            {rolLabel == 'Admin' ? 'Administrador' : rolLabel}
          </span>
        </div>
      </div>
      <div className="user-panel-divider" />
      <button className="user-panel-logout" onClick={logout}>
        <span className="logout-icon-circle">
          <LogoutOutlined />
        </span>
        <span>Cerrar sesión</span>
      </button>
    </div>
  );

  return (
    <header className="header">
      <motion.div
        className={`main-pill${scrolled ? ' scrolled' : ''}${compact ? ' compact' : ''}`}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          className="pill-logo"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('oposiciones')}
        >
          <img src={isotipo} alt="logo" className="logo-header" />
        </motion.div>

        <div className="pill-separator" />

        {navItems.map((item) => {
          const active = currentPage === item.key;
          return (
            <Tooltip key={item.key} title={scrolled ? item.label : ''} placement="bottom">
              <motion.button
                className={`pill-nav-item${active ? ' active' : ''}`}
                onClick={() => onNavigate(item.key)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="pill-item-icon">{item.icon}</span>
                <span className="pill-item-label">{item.label}</span>
              </motion.button>
            </Tooltip>
          );
        })}

        <div className="pill-separator" />

        <Dropdown popupRender={() => userPanel} placement="bottomRight" trigger={['click']}>
          <motion.div className="pill-user" whileHover={{ scale: 1.03 }}>
            <Avatar
              size={28}
              style={{ background: '#23C27B', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
            >
              <UserOutlined  style={{ color: '#0B1F19', fontSize: 15 }}/>
            </Avatar>
          </motion.div>
        </Dropdown>
      </motion.div>
    </header>
  );
};

export default Header;
