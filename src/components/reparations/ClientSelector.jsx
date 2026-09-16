import React, { useState, useEffect } from 'react';
import { FaPhone, FaCheckCircle, FaExclamationTriangle, FaUserPlus, FaTimes, FaCheck } from 'react-icons/fa';
import { getClients, createClient } from '../../api/clients';

/**
 * ✅ Sélecteur de client
 * - Recherche SEULEMENT après 8 chiffres
 * - Création inline si non trouvé
 */
const ClientSelector = ({ value, onChange, onClientChange }) => {
  const [clients, setClients] = useState([]);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [foundClient, setFoundClient] = useState(null);
  const [clientNotFound, setClientNotFound] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newClient, setNewClient] = useState({ nom: '', phone: '', email: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

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

  // ✅ Sync avec la valeur externe
  useEffect(() => {
    if (value && clients.length > 0) {
      const client = clients.find(c => c._id === value);
      if (client && client._id !== foundClient?._id) {
        setFoundClient(client);
        setPhoneSearch(client.phone);
      }
    } else if (!value && foundClient) {
      setFoundClient(null);
      setPhoneSearch('');
    }
  }, [value, clients]);

  // ✅ Recherche par téléphone (8 chiffres minimum)
  const handlePhoneSearch = (val) => {
    setPhoneSearch(val);
    setClientNotFound(false);
    setFoundClient(null);
    setError('');

    const clean = val.replace(/[^0-9]/g, '');

    // ✅ NE PAS CHERCHER avant 8 chiffres
    if (clean.length < 8) return;

    const client = clients.find(c => {
      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      return cPhone.includes(clean) || clean.includes(cPhone);
    });

    if (client) {
      setFoundClient(client);
      onChange(client._id);
      onClientChange?.(client);
    } else {
      setClientNotFound(true);
      setNewClient({ nom: '', phone: val, email: '' });
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    if (!newClient.phone.trim()) {
      setError('Le téléphone est obligatoire');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const res = await createClient(newClient);
      const created = res.data;
      setClients(prev => [...prev, created]);
      setFoundClient(created);
      onChange(created._id);
      onClientChange?.(created);
      setShowNewForm(false);
      setClientNotFound(false);
      setPhoneSearch(created.phone);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const handleClear = () => {
    setPhoneSearch('');
    setFoundClient(null);
    setClientNotFound(false);
    setShowNewForm(false);
    onChange('');
    onClientChange?.(null);
  };

  const digitsCount = phoneSearch.replace(/[^0-9]/g, '').length;

  return (
    <div>
      <label className="form-label-modern">
        Téléphone du client <span style={{ color: 'var(--danger)' }}>*</span>
      </label>
      <div style={{ position: 'relative' }}>
        <FaPhone style={{
          position: 'absolute', left: '14px', top: '50%',
          transform: 'translateY(-50%)', color: 'var(--gray-400)',
          fontSize: '12px', pointerEvents: 'none',
        }} />
        <input
          type="tel"
          value={phoneSearch}
          onChange={(e) => handlePhoneSearch(e.target.value)}
          placeholder="Ex: 20 123 456"
          className="form-control-modern"
          style={{ paddingLeft: '38px', paddingRight: foundClient ? '36px' : '14px', width: '100%' }}
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
          >
            <FaTimes size={12} />
          </button>
        )}
      </div>

      {/* ✅ Aide : nombre de chiffres */}
      {!foundClient && phoneSearch && digitsCount < 8 && (
        <div style={{
          marginTop: '6px', fontSize: '11.5px', color: 'var(--gray-500)',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span>💡</span>
          <span>{digitsCount}/8 chiffres - Saisissez le numéro complet</span>
        </div>
      )}

      {/* Client trouvé */}
      {foundClient && (
        <div style={{
          marginTop: '10px', padding: '10px 14px',
          background: 'var(--success-light)', borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <FaCheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>
              {foundClient.nom}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--success)', opacity: 0.85 }}>
              {foundClient.code} • {foundClient.phone}
            </div>
          </div>
        </div>
      )}

      {/* Client non trouvé */}
      {clientNotFound && !foundClient && !showNewForm && (
        <div style={{
          marginTop: '10px', padding: '10px 14px',
          background: 'var(--warning-light)', borderRadius: '10px',
          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        }}>
          <FaExclamationTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, fontSize: '12px', fontWeight: '600', color: 'var(--warning)' }}>
            Aucun client avec ce numéro
          </div>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="btn-modern btn-modern-primary"
            style={{ fontSize: '11.5px', padding: '6px 12px' }}
          >
            <FaUserPlus size={10} /> Créer
          </button>
        </div>
      )}

      {/* Formulaire nouveau client */}
      {showNewForm && (
        <div style={{
          marginTop: '10px', padding: '12px',
          background: 'var(--gray-50)', borderRadius: '10px',
          border: '1px solid var(--gray-200)',
        }}>
          {error && (
            <div style={{
              padding: '8px 12px', background: 'var(--danger-light)',
              color: 'var(--danger)', borderRadius: '8px',
              fontSize: '12px', marginBottom: '10px',
            }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              value={newClient.nom}
              onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
              placeholder="Nom complet *"
              className="form-control-modern"
              style={{ width: '100%' }}
              autoFocus
            />
            <input
              type="tel"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              placeholder="Téléphone *"
              className="form-control-modern"
              style={{ width: '100%' }}
            />
            <input
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              placeholder="Email (optionnel)"
              className="form-control-modern"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="btn-modern btn-modern-outline"
              style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '8px' }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCreateClient}
              disabled={creating}
              className="btn-modern btn-modern-primary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '8px' }}
            >
              {creating ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Création...
                </>
              ) : (
                <>
                  <FaCheck size={11} /> Créer
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