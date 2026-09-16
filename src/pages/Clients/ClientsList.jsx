import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, FaSearch, FaUsers, FaPhone, FaEnvelope, 
  FaFileExcel, FaEye, FaEdit, FaTrash, FaFilter,
  FaTimes, FaUserCheck, FaUserTimes, FaWallet,
  FaMoneyBillWave, FaChartLine, FaCalendarAlt
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
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Filtres avancés
  const [filters, setFilters] = useState({
    status: 'all',        // all | active | inactive
    paymentStatus: 'all', // all | paid | unpaid | partial
    hasReparations: 'all',// all | yes | no
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

  // ✅ Application de tous les filtres
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Recherche
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(c =>
        c.nom?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term)
      );
    }

    // Filtre statut
    if (filters.status !== 'all') {
      result = result.filter(c => 
        filters.status === 'active' ? c.isActive : !c.isActive
      );
    }

    // Filtre paiement
    if (filters.paymentStatus !== 'all') {
      result = result.filter(c => {
        const restant = c.totalRestant || 0;
        const paye = c.totalPaye || 0;
        
        if (filters.paymentStatus === 'paid') return restant === 0 && paye > 0;
        if (filters.paymentStatus === 'unpaid') return restant > 0 && paye === 0;
        if (filters.paymentStatus === 'partial') return restant > 0 && paye > 0;
        return true;
      });
    }

    // Filtre réparations
    if (filters.hasReparations !== 'all') {
      result = result.filter(c => {
        const count = c.totalReparations || 0;
        return filters.hasReparations === 'yes' ? count > 0 : count === 0;
      });
    }

    return result;
  }, [clients, search, filters]);

  // ✅ Statistiques
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.isActive).length;
    const unpaidClients = clients.filter(c => (c.totalRestant || 0) > 0).length;
    const totalRestant = clients.reduce((sum, c) => sum + (c.totalRestant || 0), 0);
    return { totalClients, activeClients, unpaidClients, totalRestant };
  }, [clients]);

  const activeFiltersCount = 
    (filters.status !== 'all' ? 1 : 0) + 
    (filters.paymentStatus !== 'all' ? 1 : 0) + 
    (filters.hasReparations !== 'all' ? 1 : 0);

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
    await exportClients({ search });
  };

  const openFormModal = (client = null) => {
    setEditingClient(client);
    setShowFormModal(true);
  };

  // ✅ Formatage de l'avatar
  const getAvatarColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #4361ee, #3a52c9)', // Bleu
      'linear-gradient(135deg, #10b981, #059669)', // Vert
      'linear-gradient(135deg, #f59e0b, #d97706)', // Orange
      'linear-gradient(135deg, #ef4444, #dc2626)', // Rouge
      'linear-gradient(135deg, #8b5cf6, #7c3aed)', // Violet
      'linear-gradient(135deg, #ec4899, #db2777)', // Rose
      'linear-gradient(135deg, #06b6d4, #0891b2)', // Cyan
    ];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
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
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: getAvatarColor(row.nom),
            color: 'white', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: '700', fontSize: '14px',
            flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}>
            {row.nom?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '13.5px' }}>
              {row.nom}
            </div>
            {row.adresse && (
              <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                📍 {row.adresse}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      name: 'Contact',
      sortable: true,
      cell: (row) => (
        <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaPhone size={10} style={{ color: 'var(--gray-400)' }} />
            {row.phone}
          </div>
          {row.email && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              marginTop: '2px', color: 'var(--gray-500)' 
            }}>
              <FaEnvelope size={10} style={{ color: 'var(--gray-400)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
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
      width: '110px',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
          <span className="badge-modern badge-modern-primary" style={{ fontSize: '11px' }}>
            {row.totalReparations || 0}
          </span>
        </div>
      ),
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
          <strong style={{ 
            color: restant > 0 ? 'var(--danger)' : 'var(--gray-500)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
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
        <span className={`badge-modern ${row.isActive ? 'badge-modern-success' : 'badge-modern-gray'}`}>
          {row.isActive ? '✓ Actif' : '✗ Inactif'}
        </span>
      ),
    },
  ];

  return (
    <div className="fade-in-up">
      {/* Header */}
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

      {/* ✅ Cartes de statistiques */}
      <div className="row g-3 mb-4">
        {[
          { 
            label: 'Total clients', 
            value: stats.totalClients, 
            icon: <FaUsers />, 
            color: '#4361ee',
            bg: 'rgba(67, 97, 238, 0.1)',
          },
          { 
            label: 'Clients actifs', 
            value: stats.activeClients, 
            icon: <FaUserCheck />, 
            color: '#10b981',
            bg: 'rgba(16, 185, 129, 0.1)',
          },
          { 
            label: 'Clients impayés', 
            value: stats.unpaidClients, 
            icon: <FaWallet />, 
            color: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.1)',
          },
          { 
            label: 'Total à recevoir', 
            value: `${stats.totalRestant.toFixed(2)} DT`, 
            icon: <FaMoneyBillWave />, 
            color: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.1)',
            isText: true,
          },
        ].map((stat, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-3">
            <div 
              style={{
                background: 'white',
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
              <div style={{
                width: '46px', height: '46px', borderRadius: '12px',
                background: stat.bg, color: stat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', flexShrink: 0,
              }}>
                {stat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '11px', fontWeight: '600', color: 'var(--gray-500)',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  marginBottom: '2px',
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: stat.isText ? '16px' : '22px',
                  fontWeight: '800', color: 'var(--gray-900)',
                  lineHeight: 1.1,
                }}>
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recherche + bouton filtres */}
      <div className="card-modern mb-3" style={{ padding: '16px' }}>
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-8">
            <div style={{ position: 'relative' }}>
              <FaSearch style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--gray-400)',
                fontSize: '13px', pointerEvents: 'none',
              }} />
              <input
                type="text"
                className="form-control-modern"
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="Rechercher par nom, téléphone, email ou code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <button
              className={`btn-modern ${showFilters ? 'btn-modern-primary' : 'btn-modern-outline'}`}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filtres avancés
              {activeFiltersCount > 0 && (
                <span style={{
                  background: showFilters ? 'white' : 'var(--primary)',
                  color: showFilters ? 'var(--primary)' : 'white',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '10.5px',
                  fontWeight: '700',
                  marginLeft: '4px',
                }}>
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div style={{
            marginTop: '16px', paddingTop: '16px',
            borderTop: '1px solid var(--gray-200)',
            animation: 'fadeIn 200ms ease',
          }}>
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label-modern">Statut du compte</label>
                <select
                  className="form-control-modern"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="all">Tous les clients</option>
                  <option value="active">✓ Uniquement actifs</option>
                  <option value="inactive">✗ Uniquement inactifs</option>
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label-modern">Statut de paiement</label>
                <select
                  className="form-control-modern"
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="all">Tous les paiements</option>
                  <option value="paid">✅ Entièrement payés</option>
                  <option value="unpaid">⚠️ Aucun paiement</option>
                  <option value="partial">◐ Partiellement payés</option>
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label-modern">Réparations</label>
                <select
                  className="form-control-modern"
                  value={filters.hasReparations}
                  onChange={(e) => setFilters({ ...filters, hasReparations: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="all">Peu importe</option>
                  <option value="yes">Avec réparations</option>
                  <option value="no">Sans réparation</option>
                </select>
              </div>

              <div className="col-12 col-md-3 d-flex align-items-end">
                <button
                  className="btn-modern btn-modern-outline"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setFilters({ status: 'all', paymentStatus: 'all', hasReparations: 'all' });
                    setSearch('');
                  }}
                >
                  <FaTimes /> Réinitialiser
                </button>
              </div>
            </div>
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ClientsList;