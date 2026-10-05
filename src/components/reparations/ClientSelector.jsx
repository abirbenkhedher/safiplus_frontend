import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  FaSearch, FaTimes, FaCheckCircle, FaExclamationTriangle,
  FaUserPlus, FaCheck, FaEdit, FaMapMarkerAlt,
} from 'react-icons/fa';
import { getClients, createClient, updateClient } from '../../api/clients';
import { ZONES } from '../../constants/zones';

// ============================================================
// ✅ Cache global des clients (module-level)
// → 0 requête réseau après le 1er chargement
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

  // ---- Debounce recherche ----
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 250);
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

  // ---- Suggestions mémoïsées ----
  const suggestions = useMemo(() => {
    const cleanDigits = debouncedSearch.replace(/[^0-9]/g, '');
    const cleanText = debouncedSearch.trim().toUpperCase();
    if (cleanDigits.length === 0 && cleanText.length < 3) return [];

    return clients.filter((c) => {
      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      const cPhone2 = (c.phone2 || '').replace(/[^0-9]/g, '');
      const cCode = (c.code || '').replace(/[^0-9]/g, '');
      const cFid = (c.codeFidelite || '').toUpperCase();

      if (cleanText && cFid && cFid.includes(cleanText)) return true;
      if (cleanDigits.length === 0) return false;
      if (cPhone.includes(cleanDigits)) return true;
      if (cPhone2 && cPhone2.includes(cleanDigits)) return true;
      if (cCode && cCode.includes(cleanDigits)) return true;
      return false;
    });
  }, [debouncedSearch, clients]);

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

  const handleOpenCreate = useCallback(() => {
    const digits = searchTerm.replace(/[^0-9]/g, '');
    setFormData({
      nom: '',
      phone: digits.length >= 8 ? searchTerm : '',
      phone2: '', adresse: '', zone: '', codeFidelite: '',
    });
    setIsEditMode(false);
    setShowForm(true);
    setShowSuggestions(false);
    setError('');
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
        // maj cache
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
  }, [formData, isEditMode, foundClient, onChange, onClientChange]);

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

      {/* SUGGESTIONS */}
      {!foundClient && showSuggestions && debouncedSearch.trim().length >= 2 && (
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
              autoFocus
            />

            <div className="row g-2">
              <div className="col-12 col-sm-6">
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
                  style={{ width: '100%' }}
                />
              </div>
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
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-modern btn-modern-primary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '12.5px', padding: '9px' }}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(ClientSelector);