import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Button, Dropdown, Space, Avatar } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
  BookOutlined,
  FileSearchOutlined,
  EditOutlined,
  SnippetsOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import type { MenuProps } from 'antd';
import './Header.css';
import logo from '../../assets/logos/logo-completo.png';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user, logout, isProfesor, isAdmin } = useAuth();

  // Menú items - Revisiones y Correcciones solo visibles para profesores
  const menuItems = [
    { key: 'oposiciones', label: 'Oposiciones', icon: <BookOutlined />, visible: true },
    { key: 'revisiones', label: 'Revisiones', icon: <FileSearchOutlined />, visible: isProfesor },
    { key: 'correcciones', label: 'Correcciones', icon: <EditOutlined />, visible: isProfesor },
    { key: 'misconvocatorias', label: 'Mis Convocatorias', icon: <SnippetsOutlined />, visible: true },
    { key: 'admin', label: 'Administrador', icon: <EditOutlined />, visible: isAdmin },

  ].filter(item => item.visible);

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <Space>
          <UserOutlined />
          {user?.nombre}
        </Space>
      ),
    },
    {
      key: 'rol',
      label: (
        <Space>
          <span style={{ color: user?.rol === 'PROFESOR' ? '#22c55e' : user?.rol === 'ESTUDIANTE' ? '#5BE4EB' : '#ff0000' }}>
            {user?.rol === 'PROFESOR' ? 'Profesor' : user?.rol === 'ESTUDIANTE' ? 'Estudiante' : 'Admin'}
          </span>
        </Space>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          Cerrar Sesión
        </Space>
      ),
      onClick: logout,
    },
  ];

  const mobileMenuItems: MenuProps['items'] = menuItems.map(item => ({
    key: item.key,
    label: (
      <Space>
        {item.icon}
        {item.label}
      </Space>
    ),
    onClick: () => onNavigate(item.key),
  }));


  return (
    <motion.header
      className="header"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="header-content">
        <motion.div
          className="logo"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* <BookOutlined className="logo-icon" />asdasd */}
          <img src={logo} alt="logo" className='logo-header' />
          {/* <span className="logo-text">OpoReview</span> */}
        </motion.div>

        <nav className="nav-desktop">
          {menuItems.map((item) => (
            <motion.button
              key={item.key}
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.icon}
              <span>{item.label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="header-actions">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <motion.div
              className="user-avatar"
              whileHover={{ scale: 1.1 }}
            >
              <Avatar
                icon={<UserOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #16253A 0%, #5BE4EB 100%)',
                  cursor: 'pointer'
                }}
              />
            </motion.div>
          </Dropdown>

          <div className="nav-mobile">
            <Dropdown menu={{ items: mobileMenuItems }} placement="bottomRight">
              <Button
                type="text"
                icon={<MenuOutlined style={{ color: 'white', fontSize: '20px' }} />}
              />
            </Dropdown>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
