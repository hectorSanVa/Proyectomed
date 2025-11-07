import { useEffect } from 'react';
import { MdCheckCircle, MdError, MdInfo, MdWarning, MdClose } from 'react-icons/md';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 5000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <MdCheckCircle />,
    error: <MdError />,
    info: <MdInfo />,
    warning: <MdWarning />,
  };

  return (
    <div className={`toast toast-${type}`} role="alert">
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose} aria-label="Cerrar">
        <MdClose />
      </button>
    </div>
  );
};

export default Toast;

