import React, { useState, useEffect, useMemo } from 'react';
import {
  FaPlus, FaSearch, FaCalendarAlt, FaSortNumericDown,
  FaMobileAlt, FaTrademark
} from 'react-icons/fa';
import { getModeles, deleteModele } from '../../api/modeles';
import { getMarques } from '../../api/marques';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import QuickCreateModeleModal from '../../components/reparations/QuickCreateModeleModal';

const ModelesCRUD = () => {
  const [modeles, setModeles] = useState([]);
  const [marques, setMarques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // ✅ Un seul modal pour créer ET éditer
  const [showModeleModal, setShowModeleModal] = useState(false);
  const [modeleToEdit, setModeleToEdit] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarque, setFilterMarque] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [modelesRes, marquesRes] = await Promise.all([
        getModeles(),
        getMarques(),
      ]);
      const rawM = Array.isArray(modelesRes) ? modelesRes
        : Array.isArray(modelesRes?.data) ? modelesRes.data
        : Array.isArray(modelesRes?.data?.data) ? modelesRes.data.data
        : [];
      const rawMar = Array.isArray(marquesRes) ? marquesRes
        : Array.isArray(marquesRes?.data) ? marquesRes.data
        : Array.isArray(marquesRes?.data?.data) ? marquesRes.data.data
        : [];

      setModeles([...rawM].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)));
      setMarques(rawMar);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredModeles = useMemo(() => {
    let result = [...modeles];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.nom?.toLowerCase().includes(term) ||
          m.marque?.nom?.toLowerCase().includes(term)
      );
    }
    if (filterMarque) {
      result = result.filter((m) => {
        const marqueId = typeof m.marque === 'object' && m.marque !== null ? m.marque._id : m.marque;
        return marqueId === filterMarque;
      });
    }
    return result;
  }, [modeles, searchTerm, filterMarque]);

  // ✅ Ouverture modal
  const handleOpenCreate = () => {
    setModeleToEdit(null);
    setShowModeleModal(true);
  };
  const handleOpenEdit = (row) => {
    setModeleToEdit(row);
    setShowModeleModal(true);
  };
  const handleCloseModal = () => {
    setShowModeleModal(false);
    setModeleToEdit(null);
  };

  // ✅ Callback unifié
  const handleModeleSaved = async (_, isEdit) => {
    setSuccess(isEdit ? 'Modèle modifié avec succès' : 'Modèle créé avec succès');
    await loadData();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = async () => {
    try {
      await deleteModele(editingItem._id);
      setSuccess('Modèle supprimé avec succès');
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
        <span style={{ fontWeight: '600', color: 'var(--gray-500)' }}>{index + 1}</span>
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
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'var(--info-light)', color: 'var(--info)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', flexShrink: 0,
            }}
          >
            <FaMobileAlt />
          </div>
          <strong style={{ color: 'var(--gray-800)' }}>{row.nom}</strong>
        </div>
      ),
    },
    {
      name: 'Marque',
      selector: (row) => row.marque?.nom,
      sortable: true,
      cell: (row) => (
        <span className="badge-modern badge-modern-primary">
          <FaTrademark size={10} />
          {row.marque?.nom || 'N/A'}
        </span>
      ),
    },
    {
      name: 'Date de création',
      selector: (row) => row.createdAt,
      sortable: true,
      cell: (row) => (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            color: 'var(--gray-500)', fontSize: '12.5px',
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
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '4px' }}>
            Modèles
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            {modeles.length} modèle(s) enregistré(s)
          </p>
        </div>
        <button className="btn-modern btn-modern-primary" onClick={handleOpenCreate}>
          <FaPlus /> Nouveau modèle
        </button>
      </div>

      {success && (
        <div style={{
          padding: '12px 16px', background: 'var(--success-light)',
          color: 'var(--success)', borderRadius: '10px',
          marginBottom: '20px', fontSize: '13px', fontWeight: '500',
        }}>
          ✅ {success}
        </div>
      )}
      {error && !showModeleModal && (
        <div style={{
          padding: '12px 16px', background: 'var(--danger-light)',
          color: 'var(--danger)', borderRadius: '10px',
          marginBottom: '20px', fontSize: '13px', fontWeight: '500',
        }}>
          ⚠️ {error}
        </div>
      )}

      <div className="card-modern mb-4" style={{ padding: '16px' }}>
        <div className="row g-3">
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
                placeholder="Rechercher un modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-control-modern"
              style={{ width: '100%' }}
              value={filterMarque}
              onChange={(e) => setFilterMarque(e.target.value)}
            >
              <option value="">Toutes les marques</option>
              {marques.map((m) => (
                <option key={m._id} value={m._id}>{m.nom}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredModeles}
        loading={loading}
        onEdit={handleOpenEdit}
        onDelete={(row) => {
          setEditingItem(row);
          setShowDeleteDialog(true);
        }}
        searchable={false}
        emptyMessage="Aucun modèle enregistré"
        paginationPerPage={10}
      />

      {/* ✅ MODAL PARTAGÉ (création + édition) */}
      <QuickCreateModeleModal
        show={showModeleModal}
        onClose={handleCloseModal}
        onCreated={handleModeleSaved}
        marques={marques}
        modele={modeleToEdit}
      />

      <ConfirmDialog
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer le modèle"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
      />
    </div>
  );
};

export default ModelesCRUD;