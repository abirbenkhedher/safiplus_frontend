import React, { useState, useEffect } from 'react';
import { 
  FaSave, FaTimes, FaUser, FaPhone, FaEnvelope, 
  FaMapMarkerAlt, FaToggleOn, FaToggleOff, FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import { createClient, updateClient, findClientByPhone } from '../../api/clients';
import { ZONES } from '../../constants/zones';

// ============================================================
// ✅ Helper : limite à 8 chiffres (chiffres uniquement)
// ============================================================
const formatPhoneInput = (value) => {
  const digitsOnly = String(value || '').replace(/[^0-9]/g, '');
  return digitsOnly.slice(0, 8);
};

// ============================================================
// ✅ Helper : bloque les touches non-numériques
// ============================================================
const handlePhoneKeyDown = (e) => {
  const allowedKeys = [
    'Backspace', 'Delete', 'Tab', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End',
  ];

  if (allowedKeys.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return;

  // Bloquer tout ce qui n'est pas un chiffre
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

const ClientFormModal = ({ show, onClose, onSuccess, client = null }) => {
  const isEdit = Boolean(client);

  const [formData, setFormData] = useState({
  nom: '', phone: '', phone2: '', email: '', adresse: '', zone: '', isActive: true,
});
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [existingClient, setExistingClient] = useState(null);

  // Reset quand le modal s'ouvre
useEffect(() => {
  if (show) {
    setFormData(client ? {
      nom: client.nom || '',
      phone: client.phone || '',
      phone2: client.phone2 || '',
      email: client.email || '',
      adresse: client.adresse || '',
      zone: client.zone || '',
      isActive: client.isActive !== undefined ? client.isActive : true,
    } : {
      nom: '', phone: '', phone2: '', email: '', adresse: '', zone: '', isActive: true,
    });
    setError('');
    setExistingClient(null);
  }
}, [show, client]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // ✅ Limiter phone et phone2 à 8 chiffres max
    if (name === 'phone' || name === 'phone2') {
      setFormData({
        ...formData,
        [name]: formatPhoneInput(value),
      });

      if (name === 'phone') {
        setExistingClient(null);
        setError('');
      }
      return;
    }

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // ✅ Vérifier le téléphone quand l'utilisateur finit de taper
  const handlePhoneBlur = async () => {
    if (isEdit) return;
    if (!formData.phone || formData.phone.trim().length < 6) return;

    setChecking(true);
    setExistingClient(null);
    setError('');

    try {
      const result = await findClientByPhone(formData.phone);
      
      if (result.exists && result.data) {
        setExistingClient(result.data);
        setError('');
      }
    } catch (err) {
      console.error('Erreur vérification:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleUseExistingClient = () => {
  if (existingClient) {
    setFormData({
      nom: existingClient.nom,
      phone: existingClient.phone,
      phone2: existingClient.phone2 || '',
      email: existingClient.email || '',
      adresse: existingClient.adresse || '',
      zone: existingClient.zone || '',
      isActive: existingClient.isActive,
    });
    setExistingClient(null);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExistingClient(null);

    // Validation
    if (!formData.nom.trim()) return setError('Le nom est obligatoire');
    if (!formData.phone.trim()) return setError('Le téléphone est obligatoire');

    setLoading(true);
    try {
      // DOUBLE VÉRIFICATION : Avant de créer, vérifier que le téléphone n'existe pas
      if (!isEdit) {
        const checkResult = await findClientByPhone(formData.phone);
        
        if (checkResult.exists && checkResult.data) {
          setError(`Un client avec ce numéro existe déjà : ${checkResult.data.nom} (${checkResult.data.code})`);
          setExistingClient(checkResult.data);
          setLoading(false);
          return;
        }
      }

      if (isEdit) {
        await updateClient(client._id, formData);
      } else {
        await createClient(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div 
      className="modal fade show d-block" 
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} 
      tabIndex="-1"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
        <div className="modal-content" style={{ 
          border: 'none', 
          borderRadius: '20px', 
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        }}>
          
          {/* Header */}
          <div style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid var(--gray-200)',
            background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.05) 0%, rgba(67, 97, 238, 0.02) 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '22px',
              boxShadow: '0 6px 16px rgba(67, 97, 238, 0.35)',
              flexShrink: 0,
            }}>
              <FaUser />
            </div>
            <div style={{ flex: 1 }}>
              <h5 style={{
                fontSize: '18px', fontWeight: '700',
                color: 'var(--gray-900)', margin: 0,
              }}>
                {isEdit ? 'Modifier le client' : 'Nouveau client'}
              </h5>
              <p style={{
                fontSize: '12.5px', color: 'var(--gray-500)',
                margin: '3px 0 0',
              }}>
                {isEdit ? `Code: ${client?.code}` : 'Remplissez les informations ci-dessous'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                border: 'none', background: 'white',
                color: 'var(--gray-500)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms ease', fontSize: '16px',
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

          <form onSubmit={handleSubmit}>
            {/* Body */}
            <div style={{ padding: '24px 28px', maxHeight: '65vh', overflowY: 'auto' }}>
              {error && (
                <div style={{
                  padding: '12px 16px', background: 'var(--danger-light)',
                  color: 'var(--danger)', borderRadius: '10px',
                  marginBottom: '20px', fontSize: '13px',
                  fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              {/* Alerte : client existant détecté */}
              {existingClient && (
                <div style={{
                  padding: '14px 16px',
                  background: 'var(--warning-light)',
                  border: '1px solid var(--warning)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <FaExclamationTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13.5px',
                      fontWeight: '700',
                      color: 'var(--warning)',
                      marginBottom: '4px',
                    }}>
                      Ce numéro existe déjà
                    </div>
                    <div style={{
                      fontSize: '12.5px',
                      color: 'var(--warning)',
                      opacity: 0.9,
                      marginBottom: '12px',
                    }}>
                      Un client est déjà enregistré avec ce numéro :
                    </div>

                    <div style={{
                      padding: '10px 14px',
                      background: 'white',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}>
                      <div style={{
                        fontSize: '13.5px',
                        fontWeight: '700',
                        color: 'var(--gray-900)',
                        marginBottom: '4px',
                      }}>
                        {existingClient.nom}
                      </div>
                      <div style={{
                        fontSize: '11.5px',
                        color: 'var(--gray-600)',
                      }}>
                        {existingClient.code} • {existingClient.phone}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseExistingClient}
                      className="btn-modern btn-modern-primary"
                      style={{ fontSize: '12px', padding: '8px 14px', width: '100%', justifyContent: 'center' }}
                    >
                      <FaCheckCircle size={12} /> Utiliser ce client
                    </button>
                  </div>
                </div>
              )}

              {/* Nom complet */}
              <div style={{ marginBottom: '18px' }}>
                <label className="form-label-modern">
                  <FaUser size={11} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
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

              {/* Téléphone + Téléphone 2 */}
              <div className="row g-3" style={{ marginBottom: '18px' }}>
                <div className="col-12 col-md-6">
                  <label className="form-label-modern">
                    <FaPhone size={11} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
                    Téléphone <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onKeyDown={handlePhoneKeyDown}
                      onBlur={handlePhoneBlur}
                      required
                      maxLength={8}
                      inputMode="numeric"
                      className="form-control-modern"
                      placeholder="20 123 456"
                      style={{ 
                        width: '100%',
                        paddingRight: checking ? '40px' : '14px',
                      }}
                    />
                    {checking && (
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}>
                        <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                      </div>
                    )}
                  </div>
                  {/* ✅ Compteur de chiffres */}
                  <div style={{
                    fontSize: '10.5px',
                    color: formData.phone.length === 8 ? 'var(--success)' : 'var(--gray-500)',
                    marginTop: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <span>{formData.phone.length}/8 chiffres</span>
                    {formData.phone.length === 8 && <span>✅</span>}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label-modern">
                    <FaPhone size={11} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
                    Deuxième téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone2"
                    value={formData.phone2}
                    onChange={handleChange}
                    onKeyDown={handlePhoneKeyDown}
                    maxLength={8}
                    inputMode="numeric"
                    className="form-control-modern"
                    placeholder="55 789 123"
                    style={{ width: '100%' }}
                  />
                  {formData.phone2 && (
                    <div style={{
                      fontSize: '10.5px',
                      color: formData.phone2.length === 8 ? 'var(--success)' : 'var(--gray-500)',
                      marginTop: '4px',
                    }}>
                      {formData.phone2.length}/8 chiffres
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '18px' }}>
                <label className="form-label-modern">
                  <FaEnvelope size={11} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control-modern"
                  placeholder="client@email.com"
                  style={{ width: '100%' }}
                />
              </div>

           {/* Adresse */}
<div style={{ marginBottom: '18px' }}>
  <label className="form-label-modern">
    <FaMapMarkerAlt size={11} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
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

{/* ✅ NOUVEAU : Zone */}
<div style={{ marginBottom: '18px' }}>
  <label className="form-label-modern">
    <FaMapMarkerAlt size={11} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
    Zone <span style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: '400' }}>(optionnel)</span>
  </label>
  <select
    name="zone"
    value={formData.zone}
    onChange={handleChange}
    className="form-control-modern"
    style={{ width: '100%' }}
  >
    <option value="">— Sélectionnez une zone —</option>
    {ZONES.map((z) => (
      <option key={z} value={z}>{z}</option>
    ))}
  </select>
</div>

              {/* Statut (uniquement en édition) */}
              {isEdit && (
                <div style={{
                  padding: '14px 16px',
                  background: formData.isActive ? 'var(--success-light)' : 'var(--gray-100)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 200ms ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '22px',
                      color: formData.isActive ? 'var(--success)' : 'var(--gray-400)',
                    }}>
                      {formData.isActive ? <FaToggleOn /> : <FaToggleOff />}
                    </span>
                    <div>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '13.5px',
                        color: formData.isActive ? 'var(--success)' : 'var(--gray-600)',
                      }}>
                        Client {formData.isActive ? 'actif' : 'inactif'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--gray-500)' }}>
                        {formData.isActive 
                          ? 'Le client peut passer des réparations'
                          : 'Le client ne peut plus passer de réparations'}
                      </div>
                    </div>
                  </div>
                  <label className="switch-modern">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              )}

              {/* Info nouveau client */}
              {!isEdit && !existingClient && (
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--primary-light)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                }}>
                  <span>💡</span>
                  Un code client sera généré automatiquement (ex: C001)
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 28px',
              borderTop: '1px solid var(--gray-200)',
              background: 'var(--gray-50)',
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-modern btn-modern-outline"
                disabled={loading}
              >
                <FaTimes /> Annuler
              </button>
              <button
                type="submit"
                className="btn-modern btn-modern-primary"
                disabled={loading || checking || !!existingClient}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FaSave /> {isEdit ? 'Enregistrer' : 'Créer'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .switch-modern {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
        }
        .switch-modern input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .switch-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: #cbd5e1;
          transition: 300ms;
          border-radius: 26px;
        }
        .switch-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 300ms;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .switch-modern input:checked + .switch-slider {
          background-color: var(--success);
        }
        .switch-modern input:checked + .switch-slider:before {
          transform: translateX(22px);
        }
      `}</style>
    </div>
  );
};

export default ClientFormModal;