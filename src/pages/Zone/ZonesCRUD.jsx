import React, { useState, useEffect, useMemo } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaSearch,
  FaCalendarAlt, FaSortNumericDown, FaMapMarkerAlt
} from 'react-icons/fa';
import { getZones, deleteZone } from '../../api/zones';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import QuickCreateZoneModal from '../../components/reparations/QuickCreateZoneModal';

const ZonesCRUD = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // ✅ Un seul modal pour créer ET éditer
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneToEdit, setZoneToEdit] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getZones();
      const raw = Array.isArray(res) ? res
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.data?.data) ? res.data.data
        : [];

      const sorted = [...raw].sort(
        (a, b) =>
          (a.ordre ?? 0) - (b.ordre ?? 0) ||
          (a.nom || '').localeCompare(b.nom || '')
      );
      setZones(sorted);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================================
  // FILTRE
  // ============================================================
  const filteredZones = useMemo(() => {
    if (!searchTerm) return zones;
    const term = searchTerm.toLowerCase();
    return zones.filter((z) => z.nom?.toLowerCase().includes(term));
  }, [zones, searchTerm]);

  // ============================================================
  // OUVERTURE MODAL (création / édition via le même composant)
  // ============================================================
  const handleOpenCreate = () => {
    setZoneToEdit(null);
    setShowZoneModal(true);
  };

  const handleOpenEdit = (zone) => {
    setZoneToEdit(zone);
    setShowZoneModal(true);
  };

  const handleCloseModal = () => {
    setShowZoneModal(false);
    setZoneToEdit(null);
  };

  // ✅ Callback unifié : création ET édition
  const handleZoneSaved = async (saved, isEdit) => {
    setSuccess(isEdit ? 'Zone modifiée avec succès' : 'Zone créée avec succès');
    await loadData();
    setTimeout(() => setSuccess(''), 3000);
  };

  // ============================================================
  // DELETE
  // ============================================================
  const handleDelete = async () => {
    try {
      await deleteZone(editingItem._id);
      setSuccess('Zone supprimée avec succès');
      setShowDeleteDialog(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      setShowDeleteDialog(false);
    }
  };

  // ============================================================
  // COLONNES
  // ============================================================
  const columns = [
    {
      name: '#',
      width: '60px',
      center: true,
      cell: (row, index) => (
        <span style={{ fontWeight: '600', color: 'var(--gray-500)' }}>
          {index + 1}
        </span>
      ),
    },
    {
      name: 'Ordre',
      selector: (row) => row.ordre,
      sortable: true,
      width: '90px',
      center: true,
      cell: (row) => (
        <span
          className="badge-modern badge-modern-gray"
          style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: '700' }}
        >
          <FaSortNumericDown size={9} style={{ marginRight: '4px' }} />
          {row.ordre ?? 0}
        </span>
      ),
    },
    {
      name: 'Nom',
      selector: (row) => row.nom,
      sortable: true,
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--info-light, #e7f3ff)',
              color: 'var(--info, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            <FaMapMarkerAlt />
          </div>
          <strong style={{ color: 'var(--gray-800)' }}>{row.nom}</strong>
        </div>
      ),
    },
    {
      name: 'Date de création',
      selector: (row) => row.createdAt,
      sortable: true,
      cell: (row) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--gray-500)',
            fontSize: '12.5px',
          }}
        >
          <FaCalendarAlt size={11} />
          {new Date(row.createdAt).toLocaleDateString('fr-FR')}
        </div>
      ),
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="fade-in-up">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--gray-900)',
              marginBottom: '4px',
            }}
          >
            Zones
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            {zones.length} zone(s) enregistrée(s)
          </p>
        </div>
        <button
          className="btn-modern btn-modern-primary"
          onClick={handleOpenCreate}
        >
          <FaPlus /> Nouvelle zone
        </button>
      </div>

      {/* MESSAGES */}
      {success && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--success-light)',
            color: 'var(--success)',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          ✅ {success}
        </div>
      )}
      {error && !showZoneModal && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* FILTRE */}
      <div className="card-modern mb-4" style={{ padding: '16px' }}>
        <div style={{ position: 'relative' }}>
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
            className="form-control-modern"
            style={{ paddingLeft: '40px', width: '100%' }}
            placeholder="Rechercher une zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <DataTable
        columns={columns}
        data={filteredZones}
        loading={loading}
        onEdit={(row) => handleOpenEdit(row)}
        onDelete={(row) => {
          setEditingItem(row);
          setShowDeleteDialog(true);
        }}
        searchable={false}
        emptyMessage="Aucune zone enregistrée"
        paginationPerPage={10}
      />

      {/* ✅ MODAL PARTAGÉ (création + édition) */}
      <QuickCreateZoneModal
        show={showZoneModal}
        onClose={handleCloseModal}
        onCreated={handleZoneSaved}
        zone={zoneToEdit}
      />

      {/* CONFIRM DELETE */}
      <ConfirmDialog
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer la zone"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.nom}" ? Cette action est irréversible.`}
        confirmTitle=""
        confirmText="Supprimer"
      />
    </div>
  );
};

export default ZonesCRUD;