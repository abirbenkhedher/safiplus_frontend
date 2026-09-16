import React from 'react';
import { Modal } from 'react-bootstrap';
import { 
  FaExclamationTriangle, 
  FaTrash, 
  FaCheckCircle,
  FaQuestionCircle 
} from 'react-icons/fa';

const ConfirmDialog = ({
  show,
  onClose,
  onConfirm,
  title = 'Confirmation',
  message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  icon,
}) => {
  // Icône par défaut selon la variante
  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'danger':
        return <FaTrash size={24} />;
      case 'warning':
        return <FaExclamationTriangle size={24} />;
      case 'success':
        return <FaCheckCircle size={24} />;
      default:
        return <FaQuestionCircle size={24} />;
    }
  };

  // Couleur selon la variante
  const getColor = () => {
    switch (variant) {
      case 'danger':
        return { bg: 'var(--danger-light)', color: 'var(--danger)' };
      case 'warning':
        return { bg: 'var(--warning-light)', color: 'var(--warning)' };
      case 'success':
        return { bg: 'var(--success-light)', color: 'var(--success)' };
      default:
        return { bg: 'var(--primary-light)', color: 'var(--primary)' };
    }
  };

  const colorScheme = getColor();

  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Body style={{ padding: '32px 24px', textAlign: 'center' }}>
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: colorScheme.bg,
            color: colorScheme.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          {getIcon()}
        </div>

        {/* Title */}
        <h5
          style={{
            fontSize: '17px',
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '8px',
          }}
        >
          {title}
        </h5>

        {/* Message */}
        <p
          style={{
            fontSize: '13.5px',
            color: 'var(--gray-600)',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}
        >
          {message}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            className="btn-modern btn-modern-outline"
            style={{ minWidth: '100px', justifyContent: 'center' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn-modern btn-modern-${variant}`}
            style={{ minWidth: '100px', justifyContent: 'center' }}
          >
            {confirmText}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ConfirmDialog;