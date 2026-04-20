import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
} from '@ant-design/icons';
import { registerNotifyDispatch } from '@/utils/notify';

type NotifyType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: NotifyType;
  message: string;
}

const DURATION = 3500;

const config: Record<NotifyType, { icon: React.ReactNode; color: string; bg: string }> = {
  success: { icon: <CheckCircleFilled />,       color: '#23C27B', bg: 'rgba(35,194,123,0.12)' },
  error:   { icon: <CloseCircleFilled />,        color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  warning: { icon: <ExclamationCircleFilled />,  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  info:    { icon: <InfoCircleFilled />,          color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
};

const islandVariants = {
  initial: {
    opacity: 0,
    scaleX: 0.35,
    scaleY: 0.2,
    y: -12,
    borderRadius: 9999,
  },
  animate: {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    y: 0,
    borderRadius: 14,
    transition: {
      type: 'spring' as const,
      stiffness: 460,
      damping: 28,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scaleY: 0.15,
    scaleX: 0.5,
    y: -10,
    borderRadius: 9999,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
};

const ProgressBar = ({ duration, color }: { duration: number; color: string }) => (
  <motion.div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: 2,
      background: color,
      borderRadius: '0 0 14px 14px',
      opacity: 0.5,
    }}
    initial={{ width: '100%' }}
    animate={{ width: '0%' }}
    transition={{ duration: duration / 1000, ease: 'linear' }}
  />
);

export const NotificationIsland = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    registerNotifyDispatch((type, message) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts(prev => [...prev, { id, type, message }]);

      const timer = setTimeout(() => dismiss(id), DURATION);
      timers.current.set(id, timer);
    });

    return () => timers.current.forEach(clearTimeout);
  }, []);

  const dismiss = (id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 72,
      left: 0,
      right: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      zIndex: 2000,
      pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {toasts.map(toast => {
          const { icon, color, bg } = config[toast.type];
          return (
            <motion.div
              key={toast.id}
              variants={islandVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 18px 10px 14px',
                background: 'rgba(5, 10, 20, 0.92)',
                border: `1px solid ${color}33`,
                backdropFilter: 'blur(16px)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}22`,
                cursor: 'pointer',
                pointerEvents: 'auto',
                minWidth: 220,
                maxWidth: 380,
                transformOrigin: 'top center',
              }}
              onClick={() => dismiss(toast.id)}
            >
              <span style={{
                fontSize: 16,
                color,
                display: 'flex',
                alignItems: 'center',
                background: bg,
                padding: 6,
                borderRadius: 8,
                flexShrink: 0,
              }}>
                {icon}
              </span>
              <span style={{
                color: '#F4FAF8',
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.4,
              }}>
                {toast.message}
              </span>
              <ProgressBar duration={DURATION} color={color} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
