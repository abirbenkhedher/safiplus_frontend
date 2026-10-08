import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  FaSearch, FaTimes, FaCheckCircle, FaExclamationTriangle,
  FaUserPlus, FaCheck, FaEdit, FaMapMarkerAlt,
} from 'react-icons/fa';
import { getClients, createClient, updateClient } from '../../api/clients';
import { ZONES } from '../../constants/zones';

// ============================================================
// ✅ Numéro "sentinelle" pour les clients sans téléphone
// Peut être utilisé par PLUSIEURS clients — pas de vérification d'unicité
// ============================================================
const PASSENGER_PHONE = '00000000';

// ============================================================
// ✅ Cache global des clients (module-level)
// ============================================================
let clientsCache = null;
let clientsPromise = null;

const loadClientsOnce = async () => {
  if (clientsCache) return clientsCache;
  if (clientsPromise) return clientsPromise;

  clientsPromise = getClients()
    .then((res) => {
      clientsCache = res.data || [];
      return clientsCache;
    })
    .catch((err) => {
      console.error('Erreur chargement clients:', err);
      clientsPromise = null;
      return [];
    });

  return clientsPromise;
};

export const invalidateClientsCache = () => {
  clientsCache = null;
  clientsPromise = null;
};

// ============================================================
// Helpers
// ============================================================
const formatPhoneInput = (value) =>
  String(value || '').replace(/[^0-9]/g, '').slice(0, 8);

const handlePhoneKeyDown = (e) => {
  const allowedKeys = [
    'Backspace', 'Delete', 'Tab', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End',
  ];
  if (allowedKeys.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return;
  if (!/^[0-9]$/.test(e.key)) e.preventDefault();
};

// ============================================================
// ClientSelector
// ============================================================
const ClientSelector = ({ value, onChange, onClientChange }) => {
  const [clients, setClients] = useState(clientsCache || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [foundClient, setFoundClient] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nom: '', phone: '', phone2: '', adresse: '', zone: '', codeFidelite: '',
  });

  const containerRef = useRef(null);

  // ---- Chargement (une seule fois globalement) ----
  useEffect(() => {
    let mounted = true;
    if (clientsCache) {
      setClients(clientsCache);
      return;
    }
    loadClientsOnce().then((data) => {
      if (mounted) setClients(data);
    });
    return () => { mounted = false; };
  }, []);

  // ---- Debounce recherche (150ms) ----
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 150);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ---- Sync valeur externe ----
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, clients]);

  // ---- Clic extérieur ----
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
  // ✅ Recherche de doublon (exclut 00000000)
  // ============================================================
  const findClientByPhone = useCallback((phone, excludeId = null) => {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.length !== 8) return null;

    if (digits === PASSENGER_PHONE) return null;

    return clients.find((c) => {
      if (excludeId && c._id === excludeId) return false;

      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      const cPhone2 = (c.phone2 || '').replace(/[^0-9]/g, '');

      if (cPhone === PASSENGER_PHONE) return false;

      return cPhone === digits || cPhone2 === digits;
    }) || null;
  }, [clients]);

  // ============================================================
  // ✅ SUGGESTIONS — Recherche dès 1 chiffre ou 2 lettres
  // ============================================================
  const suggestions = useMemo(() => {
    const cleanDigits = debouncedSearch.replace(/[^0-9]/g, '');
    const cleanText = debouncedSearch.trim().toUpperCase();

    const hasDigits = cleanDigits.length >= 1;
    const hasText = cleanText.length >= 2;

    if (!hasDigits && !hasText) return [];

    return clients.filter((c) => {
      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      const cPhone2 = (c.phone2 || '').replace(/[^0-9]/g, '');
      const cCode = (c.code || '').replace(/[^0-9]/g, '');
      const cFid = (c.codeFidelite || '').toUpperCase();
      const cNom = (c.nom || '').toUpperCase();

      if (cleanText && (cFid.includes(cleanText) || cNom.includes(cleanText))) {
        return true;
      }

      if (cleanDigits.length > 0) {
        if (cPhone.startsWith(cleanDigits)) return true;
        if (cPhone.includes(cleanDigits)) return true;
        if (cPhone2 && cPhone2.includes(cleanDigits)) return true;
        if (cCode && cCode.includes(cleanDigits)) return true;
      }
      return false;
    });
  }, [debouncedSearch, clients]);

  // ============================================================
  // ✅ DÉTECTION "CLIENT EXISTE" après 8 chiffres (sauf 00000000)
  // ============================================================
  const exactMatchClient = useMemo(() => {
    const digits = searchTerm.replace(/[^0-9]/g, '');
    if (digits.length !== 8) return null;

    if (digits === PASSENGER_PHONE) return null;

    return clients.find((c) => {
      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      const cPhone2 = (c.phone2 || '').replace(/[^0-9]/g, '');
      if (cPhone === PASSENGER_PHONE) return false;
      return cPhone === digits || cPhone2 === digits;
    }) || null;
  }, [searchTerm, clients]);

  const cleanDigits = searchTerm.replace(/[^0-9]/g, '');

  // ---- Handlers ----
  const handleSearchChange = useCallback((val) => {
    setSearchTerm(String(val || '').slice(0, 20));
    setError('');
    setShowSuggestions(true);
  }, []);

  const handleSelectClient = useCallback((client) => {
    setFoundClient(client);
    onChange(client._id);
    onClientChange?.(client);
    setSearchTerm(client.code || client.phone || '');
    setShowSuggestions(false);
  }, [onChange, onClientChange]);

  // ✅ Pré-remplit TOUJOURS le champ téléphone avec les chiffres saisis
  const handleOpenCreate = useCallback(() => {
    const digits = searchTerm.replace(/[^0-9]/g, '');
    setFormData({
      nom: '',
      phone: digits, // ← pré-remplit même si incomplet
      phone2: '', adresse: '', zone: '', codeFidelite: '',
    });
    setIsEditMode(false);
    setShowForm(true);
    setShowSuggestions(false);
    setError('');

    // ✅ Focus sur le champ téléphone si incomplet
    if (digits.length > 0 && digits.length < 8) {
      setTimeout(() => {
        const phoneInput = containerRef.current?.querySelector('input[type="tel"]');
        phoneInput?.focus();
      }, 50);
    }
  }, [searchTerm]);

  const handleOpenEdit = useCallback(() => {
    if (!foundClient) return;
    setFormData({
      nom: foundClient.nom || '',
      phone: foundClient.phone || '',
      phone2: foundClient.phone2 || '',
      adresse: foundClient.adresse || '',
      zone: foundClient.zone || '',
      codeFidelite: foundClient.codeFidelite || '',
    });
    setIsEditMode(true);
    setShowForm(true);
    setError('');
  }, [foundClient]);

  const handleSave = useCallback(async () => {
    if (!formData.nom.trim()) return setError('Nom obligatoire');
    if (!formData.phone.trim()) return setError('Téléphone obligatoire');

    const phoneDigits = formData.phone.replace(/[^0-9]/g, '');

    // ✅ 1. Longueur exacte avec message détaillé
    if (phoneDigits.length !== 8) {
      const manquants = 8 - phoneDigits.length;
      return setError(
        `Le téléphone doit contenir 8 chiffres (${manquants} manquant${manquants > 1 ? 's' : ''})`
      );
    }

    // ✅ 2. Unicité — SAUF pour le numéro sentinelle
    if (phoneDigits !== PASSENGER_PHONE) {
      const existing = findClientByPhone(
        phoneDigits,
        isEditMode && foundClient ? foundClient._id : null
      );
      if (existing) {
        return setError(
          `Ce numéro appartient déjà à "${existing.nom}"${existing.code ? ` (${existing.code})` : ''}`
        );
      }
    }

    // ✅ 3. Téléphone 2 — unicité aussi (sauf sentinelle)
    if (formData.phone2 && formData.phone2.length > 0) {
      const phone2Digits = formData.phone2.replace(/[^0-9]/g, '');
      if (phone2Digits.length !== 8) {
        return setError('Le téléphone 2 doit contenir exactement 8 chiffres');
      }
      if (phone2Digits === phoneDigits) {
        return setError('Le téléphone 2 doit être différent du téléphone principal');
      }
      if (phone2Digits !== PASSENGER_PHONE) {
        const existing2 = findClientByPhone(
          phone2Digits,
          isEditMode && foundClient ? foundClient._id : null
        );
        if (existing2) {
          return setError(`Le téléphone 2 appartient déjà à "${existing2.nom}"`);
        }
      }
    }

    setSaving(true);
    setError('');

    try {
      const dataToSend = { ...formData };
      if (!dataToSend.codeFidelite?.trim()) delete dataToSend.codeFidelite;
      else dataToSend.codeFidelite = dataToSend.codeFidelite.trim().toUpperCase();

      let savedClient;
      if (isEditMode && foundClient) {
        const res = await updateClient(foundClient._id, dataToSend);
        savedClient = res.data;
        setClients((prev) => prev.map((c) => (c._id === savedClient._id ? savedClient : c)));
        if (clientsCache) {
          clientsCache = clientsCache.map((c) => (c._id === savedClient._id ? savedClient : c));
        }
      } else {
        const res = await createClient(dataToSend);
        savedClient = res.data;
        setClients((prev) => [...prev, savedClient]);
        if (clientsCache) clientsCache = [...clientsCache, savedClient];
      }

      setFoundClient(savedClient);
      onChange(savedClient._id);
      onClientChange?.(savedClient);
      setSearchTerm(savedClient.code || savedClient.phone || '');
      setShowForm(false);
      setIsEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || `Erreur ${isEditMode ? 'modification' : 'création'}`);
    } finally {
      setSaving(false);
    }
  }, [formData, isEditMode, foundClient, onChange, onClientChange, findClientByPhone]);

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setIsEditMode(false);
    setError('');
  }, []);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    setFoundClient(null);
    setShowSuggestions(false);
    setShowForm(false);
    setIsEditMode(false);
    onChange('');
    onClientChange?.(null);
  }, [onChange, onClientChange]);

  // ============================================================
  // ✅ États dérivés pour le champ téléphone du formulaire
  // ============================================================
  const phoneLen = formData.phone.length;
  const isPhoneIncomplete = phoneLen > 0 && phoneLen < 8;
  const isPhoneComplete = phoneLen === 8;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div ref={containerRef}>
      {/* CHAMP DE RECHERCHE */}
      <div style={{ position: 'relative' }}>
        <FaSearch
          style={{
            position: 'absolute', left: '14px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--gray-400)',
            fontSize: '12px', pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => {
            if (!foundClient && searchTerm.trim().length > 0) setShowSuggestions(true);
          }}
          maxLength={20}
          placeholder="📞 Téléphone · Code client · 🎁 FID-..."
          aria-label="Rechercher un client"
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
              position: 'absolute', right: '12px', top: '50%',
              transform: 'translateY(-50%)', background: 'transparent',
              border: 'none', color: 'var(--gray-400)', cursor: 'pointer',
            }}
            title="Retirer la sélection"
          >
            <FaTimes size={12} />
          </button>
        )}
      </div>

      {/* BANNIÈRE "CLIENT EXISTE" */}
      {!foundClient && exactMatchClient && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 14px',
            background: 'var(--warning-light, #fff3cd)',
            border: '1px solid var(--warning, #ffc107)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <FaExclamationTriangle
            size={16}
            style={{ color: 'var(--warning)', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--warning)',
              }}
            >
              ⚠️ Ce numéro existe déjà
            </div>
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--gray-700)',
                marginTop: '2px',
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <strong>{exactMatchClient.nom}</strong>
              {exactMatchClient.code && (
                <span
                  style={{
                    background: 'white',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  {exactMatchClient.code}
                </span>
              )}
              {exactMatchClient.codeFidelite && (
                <span
                  style={{
                    background: 'white',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: 'var(--warning)',
                  }}
                >
                  🎁 {exactMatchClient.codeFidelite}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSelectClient(exactMatchClient)}
            className="btn-modern btn-modern-primary"
            style={{
              fontSize: '11.5px',
              padding: '6px 12px',
              flexShrink: 0,
            }}
          >
            <FaCheckCircle size={10} /> Sélectionner
          </button>
        </div>
      )}

      {/* SUGGESTIONS */}
      {!foundClient &&
        !exactMatchClient &&
        showSuggestions &&
        debouncedSearch.trim().length >= 1 && (
        <div
          style={{
            marginTop: '6px', background: 'white',
            border: '1px solid var(--gray-200)', borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            maxHeight: '220px', overflowY: 'auto', zIndex: 100,
          }}
        >
          {suggestions.length > 0 ? (
            <>
              <div
                style={{
                  padding: '6px 12px', background: 'var(--gray-50)',
                  fontSize: '10.5px', fontWeight: 700, color: 'var(--gray-500)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  borderBottom: '1px solid var(--gray-200)',
                  position: 'sticky', top: 0,
                }}
              >
                {suggestions.length} client(s)
              </div>
              {suggestions.slice(0, 10).map((client) => (
                <div
                  key={client._id}
                  onClick={() => handleSelectClient(client)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: '1px solid var(--gray-100)',
                    transition: 'background 100ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-800)' }}>
                        {client.nom}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {client.code && (
                          <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '10px' }}>
                            {client.code}
                          </span>
                        )}
                        {client.codeFidelite && (
                          <span style={{ background: 'var(--warning-light)', color: 'var(--warning)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '10px' }}>
                            🎁 {client.codeFidelite}
                          </span>
                        )}
                        {client.phone && <span>📞 {client.phone}</span>}
                        {client.phone2 && <span>📞 {client.phone2}</span>}
                      </div>
                    </div>
                    <FaCheckCircle size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaExclamationTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: 'var(--warning)' }}>
                Aucun client pour "{searchTerm}"
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
            marginTop: '10px', padding: '10px 14px',
            background: 'var(--success-light)', borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}
        >
          <FaCheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
              {foundClient.nom}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--success)', opacity: 0.85, marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {foundClient.code && (
                <span style={{ background: 'white', padding: '1px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, fontFamily: 'monospace' }}>
                  {foundClient.code}
                </span>
              )}
              {foundClient.codeFidelite && (
                <span style={{ background: 'white', padding: '1px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--warning)' }}>
                  🎁 {foundClient.codeFidelite}
                </span>
              )}
              <span>{foundClient.phone}{foundClient.phone2 && ` • ${foundClient.phone2}`}</span>
            </div>
            {foundClient.adresse && (
              <div style={{ fontSize: '11px', color: 'var(--success)', opacity: 0.75, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaMapMarkerAlt size={9} /> {foundClient.adresse}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleOpenEdit}
            title="Modifier"
            style={{
              width: '32px', height: '32px', borderRadius: '8px', border: 'none',
              background: 'white', color: 'var(--primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)', flexShrink: 0,
            }}
          >
            <FaEdit size={13} />
          </button>
        </div>
      )}

      {/* FORMULAIRE */}
      {showForm && (
        <div
          style={{
            marginTop: '10px', padding: '14px',
            background: 'var(--gray-50)', borderRadius: '12px',
            border: '1px solid var(--gray-200)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--gray-200)' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isEditMode ? <FaEdit size={12} /> : <FaUserPlus size={12} />}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-800)' }}>
              {isEditMode ? 'Modifier le client' : 'Nouveau client'}
            </div>
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '8px', fontSize: '12px', marginBottom: '10px', fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Nom complet *"
              aria-label="Nom complet"
              className="form-control-modern"
              style={{ width: '100%' }}
              autoFocus={phoneLen === 0 || phoneLen >= 8}
            />

            <div className="row g-2">
              {/* ✅ TÉLÉPHONE PRINCIPAL avec bordure rouge/vert */}
              <div className="col-12 col-sm-6">
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })}
                    onKeyDown={handlePhoneKeyDown}
                    maxLength={8}
                    inputMode="numeric"
                    placeholder="Téléphone (8 chiffres) *"
                    aria-label="Téléphone"
                    className="form-control-modern"
                    style={{
                      width: '100%',
                      paddingRight: '54px',
                      // ✅ ROUGE si 1-7 chiffres / VERT si 8 chiffres
                      borderColor: isPhoneIncomplete
                        ? 'var(--danger, #ef4444)'
                        : isPhoneComplete
                          ? 'var(--success, #10b981)'
                          : undefined,
                      borderWidth: phoneLen > 0 ? '1.5px' : undefined,
                      transition: 'border-color 150ms ease',
                    }}
                  />

                  {/* ✅ Indicateur à droite du champ */}
                  {phoneLen > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                      }}
                    >
                      {isPhoneIncomplete ? (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: 'var(--danger)',
                            background: 'var(--danger-light, #fee)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {phoneLen}/8
                        </span>
                      ) : (
                        <FaCheckCircle size={14} style={{ color: 'var(--success)' }} />
                      )}
                    </div>
                  )}
                </div>

                {/* ✅ Message d'aide si incomplet */}
                {isPhoneIncomplete && (
                  <div
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--danger)',
                      marginTop: '3px',
                      fontWeight: 600,
                    }}
                  >
                    ⚠️ Il manque {8 - phoneLen} chiffre(s)
                  </div>
                )}
              </div>

              {/* TÉLÉPHONE 2 */}
              <div className="col-12 col-sm-6">
                <input
                  type="tel"
                  value={formData.phone2}
                  onChange={(e) => setFormData({ ...formData, phone2: formatPhoneInput(e.target.value) })}
                  onKeyDown={handlePhoneKeyDown}
                  maxLength={8}
                  inputMode="numeric"
                  placeholder="Téléphone 2 (optionnel)"
                  aria-label="Téléphone 2"
                  className="form-control-modern"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Alerte doublon dans le formulaire (hors 00000000) */}
            {isPhoneComplete && formData.phone !== PASSENGER_PHONE && (() => {
              const existing = findClientByPhone(
                formData.phone,
                isEditMode && foundClient ? foundClient._id : null
              );
              if (!existing) return null;
              return (
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'var(--warning-light, #fff3cd)',
                    border: '1px solid var(--warning, #ffc107)',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    color: 'var(--warning)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FaExclamationTriangle size={12} />
                  <span style={{ flex: 1 }}>
                    Ce numéro appartient déjà à <strong>{existing.nom}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectClient(existing);
                      setShowForm(false);
                    }}
                    style={{
                      background: 'white',
                      border: 'none',
                      color: 'var(--warning)',
                      fontWeight: 700,
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Utiliser
                  </button>
                </div>
              );
            })()}

            <input
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              placeholder="Adresse"
              aria-label="Adresse"
              className="form-control-modern"
              style={{ width: '100%' }}
            />

            <select
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="form-control-modern"
              style={{ width: '100%' }}
              aria-label="Zone"
            >
              <option value="">Zone (optionnel)</option>
              {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>

            <input
              type="text"
              value={formData.codeFidelite}
              onChange={(e) => setFormData({ ...formData, codeFidelite: e.target.value.toUpperCase() })}
              placeholder="🎁 Code fidélité (facultatif)"
              aria-label="Code fidélité"
              className="form-control-modern"
              style={{ width: '100%', fontFamily: 'monospace', letterSpacing: '0.5px' }}
              disabled={isEditMode && !!foundClient?.codeFidelite}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="btn-modern btn-modern-outline"
              style={{ flex: 1, justifyContent: 'center', fontSize: '12.5px', padding: '9px' }}
            >
              <FaTimes size={11} /> Annuler
            </button>
            {(() => {
              const phoneDigits = formData.phone.replace(/[^0-9]/g, '');
              const isIncomplete = phoneDigits.length > 0 && phoneDigits.length < 8;
              const hasDuplicate =
                phoneDigits.length === 8 &&
                phoneDigits !== PASSENGER_PHONE &&
                !!findClientByPhone(
                  phoneDigits,
                  isEditMode && foundClient ? foundClient._id : null
                );
              const isDisabled = saving || hasDuplicate || isIncomplete || phoneDigits.length === 0;

              return (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isDisabled}
                  className="btn-modern btn-modern-primary"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    fontSize: '12.5px',
                    padding: '9px',
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Enregistrement...
                    </>
                  ) : (
                    <><FaCheck size={11} /> Enregistrer</>
                  )}
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ClientSelector);