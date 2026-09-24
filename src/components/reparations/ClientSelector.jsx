import React, { useState, useEffect } from 'react';
import {
  FaPhone, FaCheckCircle, FaExclamationTriangle, FaUserPlus,
  FaTimes, FaCheck, FaEdit, FaMapMarkerAlt, FaSearch, FaIdCard
} from 'react-icons/fa';
import { getClients, createClient, updateClient } from '../../api/clients';

/**
 * ✅ Sélecteur de client intelligent
 * - Détection automatique du type de recherche :
 *   • 8+ chiffres → recherche par téléphone (phone1 OU phone2)
 *   • Format "C001" / "001" / "1" → recherche par code client
 * - Création inline : Nom complet, Téléphone 1, Téléphone 2, Adresse
 * - Modification inline avec le même formulaire
 */
const ClientSelector = ({ value, onChange, onClientChange }) => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [foundClient, setFoundClient] = useState(null);
  const [clientNotFound, setClientNotFound] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // ✅ Champs : nom (complet), phone, phone2, adresse
  const [formData, setFormData] = useState({
    nom: '',
    phone: '',
    phone2: '',
    adresse: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
  // ✅ DÉTECTION DU TYPE DE RECHERCHE
  // (uniquement CODE ou TÉLÉPHONE)
  // ============================================================
  const detectSearchType = (term) => {
    const trimmed = term.trim();
    const cleanDigits = trimmed.replace(/[^0-9]/g, '');

    // ✅ Code client explicite : "C001", "c001", "C 001"
    if (/^[Cc]\s*\d{1,5}$/.test(trimmed)) {
      return { type: 'code', value: cleanDigits.padStart(3, '0') };
    }

    // ✅ Nombre pur de 1-3 chiffres → probablement un code client ("5", "05", "005")
    if (/^\d{1,3}$/.test(trimmed) && cleanDigits.length <= 3) {
      return { type: 'code', value: cleanDigits.padStart(3, '0') };
    }

    // ✅ 8+ chiffres → téléphone
    if (cleanDigits.length >= 8) {
      return { type: 'phone', value: cleanDigits };
    }

    // ✅ Sinon → indéterminé (pas de recherche)
    return { type: 'unknown', value: trimmed };
  };

  // ============================================================
  // RECHERCHE INTELLIGENTE (code OU téléphone uniquement)
  // ============================================================
  const handleSearch = (val) => {
    setSearchTerm(val);
    setClientNotFound(false);
    setFoundClient(null);
    setError('');

    const { type, value } = detectSearchType(val);

    // Ne pas chercher tant que la saisie est trop courte
    if (type === 'unknown') return;
    if (type === 'phone' && value.length < 8) return;
    if (type === 'code' && value.length < 1) return;

    let client = null;

    if (type === 'code') {
      // ✅ Recherche par code client
      client = clients.find((c) => {
        const cCode = (c.code || '').replace(/[^0-9]/g, '');
        return cCode === value;
      });
    } else if (type === 'phone') {
      // ✅ Recherche par téléphone (phone OU phone2)
      client = clients.find((c) => {
        const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
        const cPhone2 = (c.phone2 || '').replace(/[^0-9]/g, '');
        return (
          cPhone.includes(value) ||
          value.includes(cPhone) ||
          (cPhone2 && (cPhone2.includes(value) || value.includes(cPhone2)))
        );
      });
    }

    if (client) {
      setFoundClient(client);
      onChange(client._id);
      onClientChange?.(client);
    } else {
      setClientNotFound(true);
      // Pré-remplir le formulaire avec les données saisies
      setFormData({
        nom: '',
        phone: type === 'phone' ? val : '',
        phone2: '',
        adresse: '',
      });
    }
  };

  // ============================================================
  // OUVRIR LE FORMULAIRE DE CRÉATION
  // ============================================================
  const handleOpenCreate = () => {
    const { type } = detectSearchType(searchTerm);
    setFormData({
      nom: '',
      phone: type === 'phone' ? searchTerm : '',
      phone2: '',
      adresse: '',
    });
    setIsEditMode(false);
    setShowForm(true);
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
    });
    setIsEditMode(true);
    setShowForm(true);
    setError('');
  };

  // ============================================================
  // ENREGISTRER (création OU modification)
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
      setClientNotFound(false);
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
    setClientNotFound(false);
    setShowForm(false);
    setIsEditMode(false);
    onChange('');
    onClientChange?.(null);
  };

  // ============================================================
  // INDICATEURS VISUELS
  // ============================================================
  const { type: searchType } = detectSearchType(searchTerm);
  const digitsCount = searchTerm.replace(/[^0-9]/g, '').length;

  const getSearchPlaceholder = () =>
    'Téléphone ou code client (ex: C001)...';

  const getSearchIcon = () => {
    if (searchType === 'code') return <FaIdCard size={12} />;
    return <FaSearch size={12} />;
  };

  const getHintText = () => {
    if (searchType === 'phone' && digitsCount > 0 && digitsCount < 8) {
      return `${digitsCount}/8 chiffres - Complétez le numéro de téléphone`;
    }
    if (searchType === 'code' && searchTerm) {
      const cleanCode = searchTerm.replace(/[^0-9]/g, '').padStart(3, '0');
      return `Recherche par code : C${cleanCode}`;
    }
    if (searchType === 'unknown' && searchTerm.length > 0) {
      return 'Saisissez un code (ex: C001) ou un numéro (8 chiffres)';
    }
    return null;
  };

  const hintText = getHintText();

  return (
    <div>
      <label className="form-label-modern">
        Rechercher un client <span style={{ color: 'var(--danger)' }}>*</span>
      </label>

      {/* ============================================================ */}
      {/* CHAMP DE RECHERCHE INTELLIGENT */}
      {/* ============================================================ */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color:
              searchType === 'code'
                ? 'var(--primary)'
                : searchType === 'phone'
                  ? 'var(--info)'
                  : 'var(--gray-400)',
            pointerEvents: 'none',
            transition: 'color 150ms ease',
          }}
        >
          {getSearchIcon()}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={getSearchPlaceholder()}
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

      {/* ============================================================ */}
      {/* BADGE : TYPE DE RECHERCHE DÉTECTÉ */}
      {/* ============================================================ */}
      {!foundClient && searchType === 'code' && searchTerm && (
        <div
          style={{
            marginTop: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: '12px',
            fontSize: '10.5px',
            fontWeight: '700',
            letterSpacing: '0.3px',
          }}
        >
          <FaIdCard size={9} />
          RECHERCHE PAR CODE
        </div>
      )}

      {!foundClient && searchType === 'phone' && digitsCount >= 8 && (
        <div
          style={{
            marginTop: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            background: 'var(--info-light)',
            color: 'var(--info)',
            borderRadius: '12px',
            fontSize: '10.5px',
            fontWeight: '700',
            letterSpacing: '0.3px',
          }}
        >
          <FaPhone size={9} />
          RECHERCHE PAR TÉLÉPHONE
        </div>
      )}

      {/* ============================================================ */}
      {/* AIDE CONTEXTUELLE */}
      {/* ============================================================ */}
      {!foundClient && hintText && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '11.5px',
            color: 'var(--gray-500)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>💡</span>
          <span>{hintText}</span>
        </div>
      )}

      {/* Astuce quand vide */}
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
            Tapez un <strong>numéro de téléphone</strong> (8 chiffres) ou un{' '}
            <strong>code client</strong> (ex: C001)
          </span>
        </div>
      )}

      {/* ============================================================ */}
      {/* CLIENT TROUVÉ */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* CLIENT NON TROUVÉ */}
      {/* ============================================================ */}
      {clientNotFound && !foundClient && !showForm && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px 14px',
            background: 'var(--warning-light)',
            borderRadius: '10px',
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
            Aucun client trouvé
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

      {/* ============================================================ */}
      {/* FORMULAIRE (création OU modification) */}
      {/* ============================================================ */}
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
          {/* Titre */}
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

          {/* Erreur */}
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

          {/* Champs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Nom complet */}
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

            {/* Téléphone + Téléphone 2 */}
            <div className="row g-2">
              <div className="col-12 col-sm-6">
                <label className="form-label-modern">
                  Téléphone <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Ex: 20 123 456"
                  className="form-control-modern"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label-modern">Deuxième téléphone</label>
                <input
                  type="tel"
                  value={formData.phone2}
                  onChange={(e) =>
                    setFormData({ ...formData, phone2: e.target.value })
                  }
                  placeholder="Ex: 55 789 123"
                  className="form-control-modern"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Adresse */}
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
          </div>

          {/* Boutons */}
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