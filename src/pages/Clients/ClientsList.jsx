import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus, FaSearch, FaUsers, FaPhone, FaEnvelope,
  FaFileExcel, FaTimes, FaUserCheck, FaWallet,
  FaMoneyBillWave, FaTrophy,
} from 'react-icons/fa';
import { getClients, deleteClient } from '../../api/clients';
import { exportClients } from '../../api/export';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import ClientFormModal from './ClientFormModal';

const ClientsList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ Filtres sur une seule ligne
  const [filters, setFilters] = useState({
    search: '',
    paymentStatus: 'all', // all | paid | unpaid | partial
    hasReparations: 'all', // all | yes | no
    topClients: 'all',     // all | 5 | 10 | 20
  });

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await getClients();
      setClients(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // ============================================================
  // ✅ Application de tous les filtres + Top clients
  // ============================================================
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // ✅ Recherche (nom, phone, phone2, email, code, adresse)
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter((c) =>
        c.nom?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.phone2?.includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term) ||
        c.adresse?.toLowerCase().includes(term)
      );
    }

    // ✅ Filtre paiement
    if (filters.paymentStatus !== 'all') {
      result = result.filter((c) => {
        const restant = c.totalRestant || 0;
        const paye = c.totalPaye || 0;

        if (filters.paymentStatus === 'paid') return restant === 0 && paye > 0;
        if (filters.paymentStatus === 'unpaid') return restant > 0 && paye === 0;
        if (filters.paymentStatus === 'partial') return restant > 0 && paye > 0;
        return true;
      });
    }

    // ✅ Filtre réparations (avec/sans)
    if (filters.hasReparations !== 'all') {
      result = result.filter((c) => {
        const count = c.totalReparations || 0;
        return filters.hasReparations === 'yes' ? count > 0 : count === 0;
      });
    }

    // ✅ NOUVEAU : Filtre TOP CLIENTS (par nombre de réparations)
    if (filters.topClients !== 'all') {
      const limit = parseInt(filters.topClients);

      // Trier par nombre de réparations (décroissant)
      result = result
        .filter((c) => (c.totalReparations || 0) > 0) // Uniquement ceux qui ont des réparations
        .sort((a, b) => (b.totalReparations || 0) - (a.totalReparations || 0))
        .slice(0, limit); // Garder seulement le top N
    }

    return result;
  }, [clients, filters]);

  // ============================================================
  // ✅ Statistiques
  // ============================================================
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.isActive).length;
    const unpaidClients = clients.filter((c) => (c.totalRestant || 0) > 0).length;
    const totalRestant = clients.reduce((sum, c) => sum + (c.totalRestant || 0), 0);
    return { totalClients, activeClients, unpaidClients, totalRestant };
  }, [clients]);

  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v !== 'all' && v !== ''
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      paymentStatus: 'all',
      hasReparations: 'all',
      topClients: 'all',
    });
  };

  const handleDelete = async () => {
    try {
      await deleteClient(selectedClient._id);
      setSuccess('Client supprimé avec succès');
      setShowDeleteDialog(false);
      loadClients();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      setShowDeleteDialog(false);
    }
  };

  const handleExportExcel = async () => {
    await exportClients({ search: filters.search });
  };

  const openFormModal = (client = null) => {
    setEditingClient(client);
    setShowFormModal(true);
  };

  const columns = [
    {
      name: 'Code',
      selector: (row) => row.code,
      sortable: true,
      width: '90px',
      cell: (row) => (
        <span className="badge-modern badge-modern-primary" style={{ fontSize: '10.5px' }}>
          {row.code}
        </span>
      ),
    },
   {
  name: 'Client',
  selector: (row) => row.nom,
  sortable: true,
  grow: 2,
  minWidth: '220px',
  cell: (row) => (
    <div>
      <div style={{ fontWeight: '600', fontSize: '13.5px' }}>{row.nom}</div>
      {row.adresse && (
        <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
          📍 {row.adresse}
        </div>
      )}
      {/* ✅ NOUVEAU : Zone */}
      {row.zone && (
        <div style={{ fontSize: '10.5px', color: 'var(--gray-400)', marginTop: '2px' }}>
          🗺️ {row.zone}
        </div>
      )}
    </div>
  ),
},
    {
      name: 'Contact',
      sortable: true,
      grow: 1.5,
      minWidth: '180px',
      cell: (row) => (
        <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaPhone size={10} style={{ color: 'var(--gray-400)' }} />
            {row.phone}
            {row.phone2 && (
              <span style={{ color: 'var(--gray-400)' }}>• {row.phone2}</span>
            )}
          </div>
          {row.email && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '2px',
                color: 'var(--gray-500)',
              }}
            >
              <FaEnvelope size={10} style={{ color: 'var(--gray-400)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                {row.email}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      name: 'Réparations',
      selector: (row) => row.totalReparations,
      sortable: true,
      center: true,
      width: '120px',
      cell: (row) => {
        const count = row.totalReparations || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
            <span className="badge-modern badge-modern-primary" style={{ fontSize: '11px' }}>
              {count}
            </span>
            {count >= 10 && <FaTrophy size={11} style={{ color: '#f59e0b' }} title="Client fidèle !" />}
          </div>
        );
      },
    },
    {
      name: 'Payé',
      selector: (row) => row.totalPaye,
      sortable: true,
      cell: (row) => (
        <strong style={{ color: 'var(--success)' }}>
          {(row.totalPaye || 0).toFixed(2)} DT
        </strong>
      ),
    },
    {
      name: 'Restant',
      selector: (row) => row.totalRestant,
      sortable: true,
      cell: (row) => {
        const restant = row.totalRestant || 0;
        return (
          <strong
            style={{
              color: restant > 0 ? 'var(--danger)' : 'var(--gray-500)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {restant > 0 && '⚠️'}
            {restant.toFixed(2)} DT
          </strong>
        );
      },
    },
    {
      name: 'Statut',
      selector: (row) => row.isActive,
      sortable: true,
      center: true,
      width: '100px',
      cell: (row) => (
        <span
          className={`badge-modern ${row.isActive ? 'badge-modern-success' : 'badge-modern-gray'}`}
        >
          {row.isActive ? '✓ Actif' : '✗ Inactif'}
        </span>
      ),
    },
  ];

  return (
    <div className="fade-in-up">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '4px' }}>
            Clients
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            {filteredClients.length} / {clients.length} client(s) affiché(s)
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn-modern btn-modern-success" onClick={handleExportExcel}>
            <FaFileExcel /> Exporter
          </button>
          <button className="btn-modern btn-modern-primary" onClick={() => openFormModal()}>
            <FaPlus /> Nouveau client
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div style={{ padding: '12px 16px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Cartes de statistiques */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total clients', value: stats.totalClients, icon: <FaUsers />, color: '#4361ee', bg: 'rgba(67, 97, 238, 0.1)' },
          { label: 'Clients actifs', value: stats.activeClients, icon: <FaUserCheck />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
          { label: 'Clients impayés', value: stats.unpaidClients, icon: <FaWallet />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
          { label: 'Total à recevoir', value: `${stats.totalRestant.toFixed(2)} DT`, icon: <FaMoneyBillWave />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', isText: true },
        ].map((stat, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-3">
            <div
              style={{
                background: 'var(--gray-50)',
                border: '1px solid var(--gray-200)',
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 200ms ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: stat.bg,
                  color: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--gray-500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px',
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: stat.isText ? '16px' : '22px',
                    fontWeight: '800',
                    color: 'var(--gray-900)',
                    lineHeight: 1.1,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* BARRE DE FILTRES UNIFIÉE (sur une seule ligne) */}
      {/* ============================================================ */}
      <div className="card-modern mb-3" style={{ padding: '14px 16px' }}>
        <div className="clients-filters-grid">
          {/* Recherche */}
          <div style={{ position: 'relative', minWidth: 0 }}>
            <FaSearch
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gray-400)',
                fontSize: '13px',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              name="search"
              className="form-control-modern"
              style={{ paddingLeft: '40px', width: '100%', height: '42px' }}
              placeholder="Rechercher : nom, téléphone, email, code..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          {/* ✅ Filtre Statut de paiement */}
          <select
            name="paymentStatus"
            className="form-control-modern"
            style={{ height: '42px' }}
            value={filters.paymentStatus}
            onChange={handleFilterChange}
            title="Filtrer par statut de paiement"
          >
            <option value="all">Tous les paiements</option>
            <option value="paid">✅ Entièrement payés</option>
            <option value="unpaid">⚠️ Aucun paiement</option>
            <option value="partial">◐ Partiellement payés</option>
          </select>

          {/* ✅ Filtre Réparations */}
          <select
            name="hasReparations"
            className="form-control-modern"
            style={{ height: '42px' }}
            value={filters.hasReparations}
            onChange={handleFilterChange}
            title="Filtrer par réparations"
          >
            <option value="all">Peu importe</option>
            <option value="yes">Avec réparations</option>
            <option value="no">Sans réparation</option>
          </select>

          {/* ✅ NOUVEAU : Filtre Top Clients */}
          <select
            name="topClients"
            className="form-control-modern"
            style={{ height: '42px' }}
            value={filters.topClients}
            onChange={handleFilterChange}
            title="Classer par nombre de réparations"
          >
            <option value="all">🏆 Aucun classement</option>
            <option value="5">🥇 Top 5 clients</option>
            <option value="10">🥈 Top 10 clients</option>
            <option value="20">🥉 Top 20 clients</option>
          </select>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              className="btn-modern btn-modern-outline"
              style={{ height: '42px', padding: '0 16px', justifyContent: 'center' }}
              onClick={resetFilters}
              title="Réinitialiser les filtres"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '11.5px',
              color: 'var(--gray-500)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔎</span>
            <span>{filteredClients.length} résultat(s) avec filtres actifs</span>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredClients}
        loading={loading}
        onRowClicked={(row) => navigate(`/clients/${row._id}`)}
        onView={(row) => navigate(`/clients/${row._id}`)}
        onEdit={(row) => openFormModal(row)}
        onDelete={(row) => {
          setSelectedClient(row);
          setShowDeleteDialog(true);
        }}
        searchable={false}
        emptyMessage="Aucun client trouvé"
        paginationPerPage={10}
      />

      {/* Modal d'ajout/modification */}
      <ClientFormModal
        show={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingClient(null);
        }}
        onSuccess={() => {
          loadClients();
          setSuccess(editingClient ? 'Client modifié' : 'Client créé avec succès');
          setTimeout(() => setSuccess(''), 3000);
        }}
        client={editingClient}
      />

      <ConfirmDialog
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer le client"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedClient?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
      />

      <style>{`
        /* ✅ Grille des filtres - tout sur une ligne */
        .clients-filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr auto;
          gap: 10px;
          align-items: center;
        }

        @media (max-width: 1200px) {
          .clients-filters-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 576px) {
          .clients-filters-grid {
            grid-template-columns: 1fr;
          }
          .clients-filters-grid > * {
            width: 100% !important;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ClientsList;