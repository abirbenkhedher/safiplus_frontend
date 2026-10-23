import React, { useState, useEffect, useMemo } from 'react';
import {
  FaPlus, FaSearch, FaCalendarAlt, FaSortNumericDown,
  FaTrademark, FaClipboardList
} from 'react-icons/fa';
import { getMarques, deleteMarque } from '../../api/marques';
import { getObjets } from '../../api/objets';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import QuickCreateMarqueModal from '../../components/reparations/QuickCreateMarqueModal';

const MarquesCRUD = () => {
  const [marques, setMarques] = useState([]);
  const [objets, setObjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // ✅ Un seul modal pour créer ET éditer
  const [showMarqueModal, setShowMarqueModal] = useState(false);
  const [marqueToEdit, setMarqueToEdit] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterObjet, setFilterObjet] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [marquesRes, objetsRes] = await Promise.all([
        getMarques(),
        getObjets(),
      ]);
      const rawM = Array.isArray(marquesRes) ? marquesRes
        : Array.isArray(marquesRes?.data) ? marquesRes.data
        : Array.isArray(marquesRes?.data?.data) ? marquesRes.data.data
        : [];
      const rawO = Array.isArray(objetsRes) ? objetsRes
        : Array.isArray(objetsRes?.data) ? objetsRes.data
        : Array.isArray(objetsRes?.data?.data) ? objetsRes.data.data
        : [];

      setMarques([...rawM].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)));
      setObjets(rawO);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMarques = useMemo(() => {
    let result = [...marques];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.nom?.toLowerCase().includes(term) ||
          m.objet?.nom?.toLowerCase().includes(term)
      );
    }
    if (filterObjet) {
      result = result.filter((m) => {
        const objetId = typeof m.objet === 'object' && m.objet !== null ? m.objet._id : m.objet;
        return objetId === filterObjet;
      });
    }
    return result;
  }, [marques, searchTerm, filterObjet]);

  // ✅ Ouverture modal (create / edit)
  const handleOpenCreate = () => {
    setMarqueToEdit(null);
    setShowMarqueModal(true);
  };
  const handleOpenEdit = (row) => {
    setMarqueToEdit(row);
    setShowMarqueModal(true);
  };
  const handleCloseModal = () => {
    setShowMarqueModal(false);
    setMarqueToEdit(null);
  };

  // ✅ Callback unifié
  const handleMarqueSaved = async (_, isEdit) => {
    setSuccess(isEdit ? 'Marque modifiée avec succès' : 'Marque créée avec succès');
    await loadData();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = async () => {
    try {
      await deleteMarque(editingItem._id);
      setSuccess('Marque supprimée avec succès');
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
              background: 'var(--warning-light, #fff3cd)',
              color: 'var(--warning, #f59e0b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', flexShrink: 0,
            }}
          >
            <FaTrademark />
          </div>
          <strong style={{ color: 'var(--gray-800)' }}>{row.nom}</strong>
        </div>
      ),
    },
    {
      name: 'Objet',
      selector: (row) => row.objet?.nom,
      sortable: true,
      cell: (row) => (
        <span className="badge-modern badge-modern-primary">
          <FaClipboardList size={10} />
          {row.objet?.nom || 'N/A'}
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
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '4px' }}>
            Marques
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            {marques.length} marque(s) enregistrée(s)
          </p>
        </div>
        <button className="btn-modern btn-modern-primary" onClick={handleOpenCreate}>
          <FaPlus /> Nouvelle marque
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
      {error && !showMarqueModal && (
        <div style={{
          padding: '12px 16px', background: 'var(--danger-light)',
          color: 'var(--danger)', borderRadius: '10px',
          marginBottom: '20px', fontSize: '13px', fontWeight: '500',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* FILTRES */}
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
                placeholder="Rechercher une marque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-control-modern"
              style={{ width: '100%' }}
              value={filterObjet}
              onChange={(e) => setFilterObjet(e.target.value)}
            >
              <option value="">Tous les objets</option>
              {objets.map((o) => (
                <option key={o._id} value={o._id}>{o.nom}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredMarques}
        loading={loading}
        onEdit={handleOpenEdit}
        onDelete={(row) => {
          setEditingItem(row);
          setShowDeleteDialog(true);
        }}
        searchable={false}
        emptyMessage="Aucune marque enregistrée"
        paginationPerPage={10}
      />

      {/* ✅ MODAL PARTAGÉ (création + édition) */}
      <QuickCreateMarqueModal
        show={showMarqueModal}
        onClose={handleCloseModal}
        onCreated={handleMarqueSaved}
        objets={objets}
        marque={marqueToEdit}
      />

      <ConfirmDialog
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer la marque"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
      />
    </div>
  );
};

export default MarquesCRUD;