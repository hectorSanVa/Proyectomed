import { MdWarning, MdError, MdInfo, MdCheckCircle } from 'react-icons/md';
import './ConfirmModal.css';

export type ConfirmType = 'warning' | 'danger' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const icons = {
    warning: <MdWarning />,
    danger: <MdError />,
    info: <MdInfo />,
    success: <MdCheckCircle />,
  };

  const iconColors = {
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    success: '#28a745',
  };

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <div className="confirm-modal-icon" style={{ color: iconColors[type] }}>
            {icons[type]}
          </div>
          <h2 className="confirm-modal-title">{title}</h2>
        </div>
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        <div className="confirm-modal-footer">
          <button className="btn-confirm-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`btn-confirm-${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;


