import React, { useState, useEffect, useRef } from 'react';
import {
  FaPhone, FaCheckCircle, FaExclamationTriangle, FaUserPlus,
  FaTimes, FaCheck, FaEdit, FaMapMarkerAlt, FaSearch, FaIdCard
} from 'react-icons/fa';
import { getClients, createClient, updateClient } from '../../api/clients';
import { ZONES } from '../../constants/zones';

// ============================================================
// ✅ Helpers
// ============================================================
const formatPhoneInput = (value) => {
  const digitsOnly = String(value || '').replace(/[^0-9]/g, '');
  return digitsOnly.slice(0, 8);
};

const handlePhoneKeyDown = (e) => {
  const allowedKeys = [
    'Backspace', 'Delete', 'Tab', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End',
  ];

  if (allowedKeys.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return;

  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * ✅ Sélecteur de client avec suggestions
 * - Liste déroulante au fur et à mesure de la saisie
 * - Recherche dans téléphone 1, téléphone 2, code client
 * - Sélection par clic (pas d'auto-sélection)
 * - Création inline possible
 * - ✅ Limité à 8 chiffres max
 */
const ClientSelector = ({ value, onChange, onClientChange }) => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [foundClient, setFoundClient] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

 const [formData, setFormData] = useState({
  nom: '',
  phone: '',
  phone2: '',
  adresse: '',
  zone: '',
});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const containerRef = useRef(null);

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await getClients();
        setClients(res.data);
      } catch (err) {
        console.error('Erreur chargement clients:', err);
      }
    };
    loadClients();
  }, []);

  // ============================================================
  // SYNC AVEC LA VALEUR EXTERNE
  // ============================================================
  useEffect(() => {
    if (value && clients.length > 0) {
      const client = clients.find((c) => c._id === value);
      if (client && client._id !== foundClient?._id) {
        setFoundClient(client);
        setSearchTerm(client.code || client.phone || '');
      }
    } else if (!value && foundClient) {
      setFoundClient(null);
      setSearchTerm('');
    }
  }, [value, clients]);

  // ============================================================
  // FERMER LA LISTE AU CLIC EXTÉRIEUR
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================
  // ✅ FILTRER LES CLIENTS SELON LA SAISIE
  // ============================================================
  const getSuggestions = () => {
    const cleanDigits = searchTerm.replace(/[^0-9]/g, '');

    if (cleanDigits.length === 0) return [];

    return clients.filter((c) => {
      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      const cPhone2 = (c.phone2 || '').replace(/[^0-9]/g, '');
      const cCode = (c.code || '').replace(/[^0-9]/g, '');

      if (cPhone.includes(cleanDigits)) return true;
      if (cPhone2 && cPhone2.includes(cleanDigits)) return true;
      if (cCode && cCode.includes(cleanDigits)) return true;

      return false;
    });
  };

  const suggestions = getSuggestions();
  const cleanDigits = searchTerm.replace(/[^0-9]/g, '');

  // ============================================================
  // SAISIE
  // ============================================================
  const handleSearchChange = (val) => {
    // ✅ Limiter à 8 chiffres max (chiffres uniquement)
    const limited = formatPhoneInput(val);

    setSearchTerm(limited);
    setError('');
    setShowSuggestions(true);
  };

  // ============================================================
  // SÉLECTIONNER UN CLIENT
  // ============================================================
  const handleSelectClient = (client) => {
    setFoundClient(client);
    onChange(client._id);
    onClientChange?.(client);
    setSearchTerm(client.code || client.phone || '');
    setShowSuggestions(false);
  };

  // ============================================================
  // OUVRIR LE FORMULAIRE DE CRÉATION
  // ============================================================
const handleOpenCreate = () => {
  const cleanDigits = searchTerm.replace(/[^0-9]/g, '');
  setFormData({
    nom: '',
    phone: cleanDigits.length >= 8 ? searchTerm : '',
    phone2: '',
    adresse: '',
    zone: '',
  });
  setIsEditMode(false);
  setShowForm(true);
  setShowSuggestions(false);
  setError('');
};

  // ============================================================
  // OUVRIR LE FORMULAIRE DE MODIFICATION
  // ============================================================
const handleOpenEdit = () => {
  if (!foundClient) return;

  setFormData({
    nom: foundClient.nom || '',
    phone: foundClient.phone || '',
    phone2: foundClient.phone2 || '',
    adresse: foundClient.adresse || '',
    zone: foundClient.zone || '',
  });
  setIsEditMode(true);
  setShowForm(true);
  setError('');
};

  // ============================================================
  // ENREGISTRER
  // ============================================================
  const handleSave = async () => {
    if (!formData.nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Le téléphone est obligatoire');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let savedClient;

      if (isEditMode && foundClient) {
        const res = await updateClient(foundClient._id, formData);
        savedClient = res.data;
        setClients((prev) =>
          prev.map((c) => (c._id === savedClient._id ? savedClient : c))
        );
      } else {
        const res = await createClient(formData);
        savedClient = res.data;
        setClients((prev) => [...prev, savedClient]);
      }

      setFoundClient(savedClient);
      onChange(savedClient._id);
      onClientChange?.(savedClient);
      setSearchTerm(savedClient.code || savedClient.phone || '');

      setShowForm(false);
      setIsEditMode(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Erreur lors de ${isEditMode ? 'la modification' : 'la création'}`
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ANNULER
  // ============================================================
  const handleCancel = () => {
    setShowForm(false);
    setIsEditMode(false);
    setError('');
  };

  // ============================================================
  // EFFACER LA SÉLECTION
  // ============================================================
  const handleClear = () => {
    setSearchTerm('');
    setFoundClient(null);
    setShowSuggestions(false);
    setShowForm(false);
    setIsEditMode(false);
    onChange('');
    onClientChange?.(null);
  };

  return (
    <div ref={containerRef}>
      <label className="form-label-modern">
        Rechercher un client <span style={{ color: 'var(--danger)' }}>*</span>
      </label>

      {/* CHAMP DE RECHERCHE */}
      <div style={{ position: 'relative' }}>
        <FaSearch
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--gray-400)',
            fontSize: '12px',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handlePhoneKeyDown}
          onFocus={() => {
            if (!foundClient && cleanDigits.length > 0) {
              setShowSuggestions(true);
            }
          }}
          maxLength={8}
          inputMode="numeric"
          placeholder="Tapez le téléphone ou le code..."
          className="form-control-modern"
          style={{
            paddingLeft: '38px',
            paddingRight: foundClient ? '36px' : '14px',
            width: '100%',
          }}
          disabled={!!foundClient}
        />
        {foundClient && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--gray-400)',
              cursor: 'pointer',
            }}
            title="Retirer la sélection"
          >
            <FaTimes size={12} />
          </button>
        )}
      </div>

      {/* AIDE QUAND VIDE */}
      {!foundClient && !searchTerm && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '11px',
            color: 'var(--gray-400)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>💡</span>
          <span>
            Tapez les <strong>chiffres du téléphone</strong> (max 8) ou le{' '}
            <strong>code client</strong> (ex: 001)
          </span>
        </div>
      )}

      {/* COMPTEUR */}
      {!foundClient && searchTerm && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '10.5px',
            color: cleanDigits.length === 8 ? 'var(--success)' : 'var(--gray-500)',
          }}
        >
          {cleanDigits.length}/8 chiffres
        </div>
      )}

      {/* LISTE DE SUGGESTIONS */}
      {!foundClient && showSuggestions && cleanDigits.length > 0 && (
        <div
          style={{
            marginTop: '6px',
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            maxHeight: '240px',
            overflowY: 'auto',
            zIndex: 100,
          }}
        >
          {suggestions.length > 0 ? (
            <>
              <div
                style={{
                  padding: '6px 12px',
                  background: 'var(--gray-50)',
                  fontSize: '10.5px',
                  fontWeight: '700',
                  color: 'var(--gray-500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '1px solid var(--gray-200)',
                  position: 'sticky',
                  top: 0,
                }}
              >
                {suggestions.length} client(s) trouvé(s)
              </div>
              {suggestions.slice(0, 10).map((client) => (
                <div
                  key={client._id}
                  onClick={() => handleSelectClient(client)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--gray-100)',
                    transition: 'background 100ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--gray-800)',
                        }}
                      >
                        {client.nom}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--gray-500)',
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {client.code && (
                          <span
                            style={{
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontWeight: '700',
                              fontSize: '10px',
                            }}
                          >
                            {client.code}
                          </span>
                        )}
                        {client.phone && <span>📞 {client.phone}</span>}
                        {client.phone2 && <span>📞 {client.phone2}</span>}
                      </div>
                    </div>
                    <FaCheckCircle
                      size={14}
                      style={{ color: 'var(--primary)', flexShrink: 0 }}
                    />
                  </div>
                </div>
              ))}
              {suggestions.length > 10 && (
                <div
                  style={{
                    padding: '8px 14px',
                    fontSize: '11px',
                    color: 'var(--gray-500)',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  +{suggestions.length - 10} autre(s)... Affinez votre saisie
                </div>
              )}
            </>
          ) : (
            /* AUCUN CLIENT TROUVÉ */
            <div
              style={{
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <FaExclamationTriangle
                size={14}
                style={{ color: 'var(--warning)', flexShrink: 0 }}
              />
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--warning)',
                }}
              >
                Aucun client ne correspond à "{searchTerm}"
              </div>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="btn-modern btn-modern-primary"
                style={{ fontSize: '11.5px', padding: '6px 12px' }}
              >
                <FaUserPlus size={10} /> Créer
              </button>
            </div>
          )}
        </div>
      )}

      {/* CLIENT SÉLECTIONNÉ */}
      {foundClient && (
        <div
          style={{
            marginTop: '10px',
            padding: '12px 14px',
            background: 'var(--success-light)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <FaCheckCircle
            size={18}
            style={{ color: 'var(--success)', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: '700',
                color: 'var(--success)',
              }}
            >
              {foundClient.nom}
            </div>
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--success)',
                opacity: 0.85,
                marginTop: '2px',
              }}
            >
              {foundClient.code && (
                <span
                  style={{
                    background: 'white',
                    padding: '1px 6px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '700',
                    marginRight: '6px',
                    fontFamily: 'monospace',
                  }}
                >
                  {foundClient.code}
                </span>
              )}
              {foundClient.phone}
              {foundClient.phone2 && ` • ${foundClient.phone2}`}
            </div>
            {foundClient.adresse && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--success)',
                  opacity: 0.75,
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FaMapMarkerAlt size={9} /> {foundClient.adresse}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenEdit}
            title="Modifier ce client"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              flexShrink: 0,
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = 'var(--primary)';
            }}
          >
            <FaEdit size={13} />
          </button>
        </div>
      )}

      {/* FORMULAIRE (création OU modification) */}
      {showForm && (
        <div
          style={{
            marginTop: '10px',
            padding: '16px',
            background: 'var(--gray-50)',
            borderRadius: '12px',
            border: '1px solid var(--gray-200)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: '1px solid var(--gray-200)',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isEditMode ? <FaEdit size={12} /> : <FaUserPlus size={12} />}
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--gray-800)',
              }}
            >
              {isEditMode ? 'Modifier le client' : 'Nouveau client'}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '8px 12px',
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '10px',
                fontWeight: '500',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label className="form-label-modern">
                Nom complet <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                placeholder="Ex: Mohamed Ben Ali"
                className="form-control-modern"
                style={{ width: '100%' }}
                autoFocus
              />
            </div>

            <div className="row g-2">
              <div className="col-12 col-sm-6">
                <label className="form-label-modern">
                  Téléphone <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: formatPhoneInput(e.target.value),
                    })
                  }
                  onKeyDown={handlePhoneKeyDown}
                  maxLength={8}
                  inputMode="numeric"
                  placeholder="Ex: 20 123 456"
                  className="form-control-modern"
                  style={{ width: '100%' }}
                />
                <div
                  style={{
                    fontSize: '10.5px',
                    color: formData.phone.length === 8 ? 'var(--success)' : 'var(--gray-500)',
                    marginTop: '4px',
                  }}
                >
                  {formData.phone.length}/8 chiffres
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label-modern">Deuxième téléphone</label>
                <input
                  type="tel"
                  value={formData.phone2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone2: formatPhoneInput(e.target.value),
                    })
                  }
                  onKeyDown={handlePhoneKeyDown}
                  maxLength={8}
                  inputMode="numeric"
                  placeholder="Ex: 55 789 123"
                  className="form-control-modern"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
  <label className="form-label-modern">Adresse</label>
  <input
    type="text"
    value={formData.adresse}
    onChange={(e) =>
      setFormData({ ...formData, adresse: e.target.value })
    }
    placeholder="Ex: Av Habib Bourguiba, Hawaria"
    className="form-control-modern"
    style={{ width: '100%' }}
  />
</div>

{/* ✅ NOUVEAU : Zone */}
<div>
  <label className="form-label-modern">
    Zone <span style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: '400' }}>(optionnel)</span>
  </label>
  <select
    value={formData.zone}
    onChange={(e) =>
      setFormData({ ...formData, zone: e.target.value })
    }
    className="form-control-modern"
    style={{ width: '100%' }}
  >
    <option value="">— Sélectionnez une zone —</option>
    {ZONES.map((z) => (
      <option key={z} value={z}>{z}</option>
    ))}
  </select>
</div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="btn-modern btn-modern-outline"
              style={{
                flex: 1,
                justifyContent: 'center',
                fontSize: '12.5px',
                padding: '10px',
              }}
            >
              <FaTimes size={11} /> Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-modern btn-modern-primary"
              style={{
                flex: 1,
                justifyContent: 'center',
                fontSize: '12.5px',
                padding: '10px',
              }}
            >
              {saving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                  ></span>
                  Enregistrement...
                </>
              ) : (
                <>
                  <FaCheck size={11} /> Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSelector;