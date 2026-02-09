import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, BookOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import './Login.css';
import isotipo from '../../assets/ilustraciones/ilustracion S.png'
import logo from '../../assets/logos/logo-text.png'

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (success) {
        message.success('¡Bienvenido al sistema!');
      } else {
        message.error('Credenciales incorrectas');
      }
    } catch (error) {
      message.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    }
  };

  const logoVariants: Variants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 200,
        damping: 20
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="floating-shape"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1],
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.2
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${20 + Math.random() * 60}px`,
              height: `${20 + Math.random() * 60}px`,
            }}
          />
        ))}
      </div>

      <div className="isotipo-container">
        <img src={isotipo} alt="isotipo" className='isotipo' />
      </div>
      <AnimatePresence>
        <motion.div
          className="login-card"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="login-logo" variants={logoVariants}>
               <img src={isotipo} alt="logo-text" style={{ width: 30 }}/>
          </motion.div>

          <motion.h1 className="login-title" variants={itemVariants}>
            <img src={logo} alt="logo-text" style={{ width: 200 }}/>
          </motion.h1>

          <motion.p className="login-subtitle" variants={itemVariants}>
            Sistema de Revisión de Oposiciones
          </motion.p>

          <motion.div variants={itemVariants} style={{ width: '100%' }}>
            <Form
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Ingresa tu email' },
                  { type: 'email', message: 'Ingresa un email válido' }
                ]}
              >
                <Input
                  prefix={<UserOutlined className="input-icon" />}
                  placeholder="Email"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Ingresa tu contraseña' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Contraseña"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="login-button"
                    block
                  >
                    Iniciar Sesión
                  </Button>
                </motion.div>
              </Form.Item>
            </Form>
          </motion.div>

          <motion.p className="login-footer" variants={itemVariants}>
            © 2024 ThePower - Todos los derechos reservados
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Login;
