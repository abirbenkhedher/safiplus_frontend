import React, { useState } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { 
  FaUserPlus, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt,
  FaSave,
  FaTimes,
  FaUser
} from 'react-icons/fa';

import { createClient } from '../../api/clients';

const ClientQuickCreate = ({ show, onClose, onClientCreated }) => {
  const [formData, setFormData] = useState({
    nom: '',
    phone: '',
    email: '',
    adresse: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await createClient(formData);
      onClientCreated(response.data);
      setFormData({ nom: '', phone: '', email: '', adresse: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ nom: '', phone: '', email: '', adresse: '' });
    setError('');
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Body style={{ padding: 0 }}>
        {/* Header avec icône */}
        <div
          style={{
            padding: '24px 24px 20px',
            borderBottom: '1px solid var(--gray-200)',
            background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.05) 0%, rgba(67, 97, 238, 0.02) 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
              flexShrink: 0,
            }}
          >
            <FaUserPlus />
          </div>
          <div style={{ flex: 1 }}>
            <h5
              style={{
                fontSize: '17px',
                fontWeight: '700',
                color: 'var(--gray-900)',
                margin: 0,
              }}
            >
              Créer un nouveau client
            </h5>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--gray-500)',
                margin: '2px 0 0',
              }}
            >
              Ajoutez rapidement un client sans quitter la page
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              color: 'var(--gray-500)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease',
              fontSize: '16px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--danger-light)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = 'var(--gray-500)';
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <Form onSubmit={handleSubmit}>
          <div style={{ padding: '24px' }}>
            {/* Erreur */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--danger-light)',
                  color: 'var(--danger)',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠️</span>
                {error}
              </div>
            )}

            {/* Nom + Téléphone */}
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label-modern">
                  <FaUser size={12} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
                  Nom complet <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  autoFocus
                  className="form-control-modern"
                  placeholder="Ex: Ahmed Ben Ali"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-modern">
                  <FaPhone size={12} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
                  Téléphone <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="form-control-modern"
                  placeholder="Ex: 20 123 456"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Email + Adresse */}
            <div className="row g-3 mt-1">
              <div className="col-12 col-md-6">
                <label className="form-label-modern">
                  <FaEnvelope size={12} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control-modern"
                  placeholder="Ex: client@example.com"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label-modern">
                  <FaMapMarkerAlt size={12} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
                  Adresse
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  className="form-control-modern"
                  placeholder="Ex: 123 Rue de la République"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Info */}
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                background: 'var(--primary-light)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>💡</span>
              Un code client sera généré automatiquement (ex: C001)
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--gray-200)',
              background: 'var(--gray-50)',
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="btn-modern btn-modern-outline"
              disabled={loading}
            >
              <FaTimes /> Annuler
            </button>
            <button
              type="submit"
              className="btn-modern btn-modern-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    style={{ width: '14px', height: '14px' }}
                  ></span>
                  Création...
                </>
              ) : (
                <>
                  <FaSave /> Créer le client
                </>
              )}
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ClientQuickCreate;