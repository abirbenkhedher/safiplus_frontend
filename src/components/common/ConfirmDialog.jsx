import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import {
  FaExclamationTriangle,
  FaTrash,
  FaCheckCircle,
  FaQuestionCircle,
  FaInfoCircle,
} from 'react-icons/fa';

// ============================================================
// Boîte de confirmation unique de l'application.
// ✅ Utilisée aussi par utils/dialog.js (confirmer / demander / informer)
//    pour remplacer window.confirm / window.prompt / alert (même design).
//  - input     : { label, type, placeholder, defaultValue, required } → champ de saisie
//  - hideCancel: un seul bouton (message d'information)
// onConfirm(valeur) reçoit la saisie quand `input` est fourni.
// ============================================================
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
  input = null,
  hideCancel = false,
}) => {
  const [valeur, setValeur] = useState(input?.defaultValue ?? '');
  const [touche, setTouche] = useState(false);
  const inputRef = useRef(null);

  // Réinitialise le champ à chaque ouverture
  useEffect(() => {
    if (!show) return;
    const id = setTimeout(() => {
      setValeur(input?.defaultValue ?? '');
      setTouche(false);
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(id);
  }, [show, input?.defaultValue]);

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
      case 'info':
        return <FaInfoCircle size={24} />;
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
  const invalide = !!input?.required && !String(valeur).trim();
  const btnVariant = ['danger', 'warning', 'success'].includes(variant) ? variant : 'primary';

  const valider = (e) => {
    e?.preventDefault();
    if (input) {
      setTouche(true);
      if (invalide) return;
      onConfirm(typeof valeur === 'string' ? valeur.trim() : valeur);
    } else {
      onConfirm();
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Body style={{ padding: '32px 24px', textAlign: 'center' }}>
        <form onSubmit={valider}>
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
          {message && (
            <p
              style={{
                fontSize: '13.5px',
                color: 'var(--gray-600)',
                marginBottom: input ? '14px' : '24px',
                lineHeight: '1.5',
                whiteSpace: 'pre-line',
                overflowWrap: 'anywhere',
              }}
            >
              {message}
            </p>
          )}

          {/* Champ de saisie (motif, date…) */}
          {input && (
            <div style={{ textAlign: 'left', marginBottom: '22px' }}>
              {input.label && (
                <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                  {input.label}{input.required ? ' *' : ''}
                </label>
              )}
              <input
                ref={inputRef}
                type={input.type || 'text'}
                className="form-control-modern"
                style={{ width: '100%', borderColor: touche && invalide ? 'var(--danger)' : undefined }}
                placeholder={input.placeholder || ''}
                value={valeur}
                onChange={(e) => setValeur(e.target.value)}
              />
              {touche && invalide && (
                <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>Ce champ est obligatoire</div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {!hideCancel && (
              <button
                type="button"
                onClick={onClose}
                className="btn-modern btn-modern-outline"
                style={{ minWidth: '100px', justifyContent: 'center' }}
              >
                {cancelText}
              </button>
            )}
            <button
              type="submit"
              className={`btn-modern btn-modern-${btnVariant}`}
              style={{ minWidth: '100px', justifyContent: 'center' }}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default ConfirmDialog;
