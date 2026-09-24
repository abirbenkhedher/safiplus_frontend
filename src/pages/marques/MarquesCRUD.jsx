import React, { useState, useEffect, useMemo } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaTrademark, FaSearch, FaSave,
  FaTimes, FaCalendarAlt, FaSortNumericDown, FaClipboardList
} from 'react-icons/fa';
import {
  getMarques,
  createMarque,
  updateMarque,
  deleteMarque,
} from '../../api/marques';
import { getObjets } from '../../api/objets';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';

const MarquesCRUD = () => {
  const [marques, setMarques] = useState([]);
  const [objets, setObjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ nom: '', objet: '', ordre: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterObjet, setFilterObjet] = useState('');

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const loadData = async () => {
    try {
      setLoading(true);
      const [marquesRes, objetsRes] = await Promise.all([
        getMarques(),
        getObjets(),
      ]);

      // ✅ Tri par ordre
      const sorted = [...marquesRes.data].sort(
        (a, b) => (a.ordre || 0) - (b.ordre || 0)
      );
      setMarques(sorted);
      setObjets(objetsRes.data);
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
  // FILTRES
  // ============================================================
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
        const objetId =
          typeof m.objet === 'object' && m.objet !== null
            ? m.objet._id
            : m.objet;
        return objetId === filterObjet;
      });
    }

    return result;
  }, [marques, searchTerm, filterObjet]);

  // ============================================================
  // MODAL
  // ============================================================
  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFormData(
      item
        ? {
            nom: item.nom,
            objet:
              typeof item.objet === 'object' && item.objet !== null
                ? item.objet._id
                : item.objet || '',
            ordre: item.ordre ?? 0,
          }
        : { nom: '', objet: '', ordre: 0 }
    );
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ nom: '', objet: '', ordre: 0 });
    setError('');
  };

  // ============================================================
  // SUBMIT
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    if (!formData.objet) {
      setError('L\'objet est obligatoire');
      return;
    }

    try {
      const payload = {
        nom: formData.nom.trim(),
        objet: formData.objet,
        ordre: Number(formData.ordre) || 0,
      };

      if (editingItem) {
        await updateMarque(editingItem._id, payload);
        setSuccess('Marque modifiée avec succès');
      } else {
        await createMarque(payload);
        setSuccess('Marque créée avec succès');
      }
      handleCloseModal();
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  // ============================================================
  // DELETE
  // ============================================================
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
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              flexShrink: 0,
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
            Marques
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            {marques.length} marque(s) enregistrée(s)
          </p>
        </div>
        <button
          className="btn-modern btn-modern-primary"
          onClick={() => handleOpenModal()}
        >
          <FaPlus /> Nouvelle marque
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
      {error && !showModal && (
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

      {/* FILTRES */}
      <div className="card-modern mb-4" style={{ padding: '16px' }}>
        <div className="row g-3">
          <div className="col-12 col-md-8">
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
              {objets.map((objet) => (
                <option key={objet._id} value={objet._id}>
                  {objet.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <DataTable
        columns={columns}
        data={filteredMarques}
        loading={loading}
        onEdit={(row) => handleOpenModal(row)}
        onDelete={(row) => {
          setEditingItem(row);
          setShowDeleteDialog(true);
        }}
        searchable={false}
        emptyMessage="Aucune marque enregistrée"
        paginationPerPage={10}
      />

      {/* MODAL */}
      <div
        className={`modal fade ${showModal ? 'show d-block' : ''}`}
        style={{ background: showModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}
        tabIndex="-1"
      >
        {showModal && (
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{ border: 'none', borderRadius: '16px', overflow: 'hidden' }}
            >
              {/* HEADER */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--gray-200)',
                  background:
                    'linear-gradient(135deg, rgba(67, 97, 238, 0.05) 0%, rgba(67, 97, 238, 0.02) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  <FaTrademark />
                </div>
                <div style={{ flex: 1 }}>
                  <h5
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: 'var(--gray-900)',
                      margin: 0,
                    }}
                  >
                    {editingItem ? 'Modifier la marque' : 'Nouvelle marque'}
                  </h5>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--gray-500)',
                      margin: '2px 0 0',
                    }}
                  >
                    {editingItem
                      ? 'Modifiez les informations ci-dessous'
                      : 'Créez une nouvelle marque'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'white',
                    color: 'var(--gray-500)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit}>
                <div style={{ padding: '24px' }}>
                  {error && (
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

                  {/* Nom */}
                  <div className="mb-3">
                    <label className="form-label-modern">
                      Nom de la marque{' '}
                      <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control-modern"
                      placeholder="Ex: Samsung, Apple, Xiaomi..."
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData({ ...formData, nom: e.target.value })
                      }
                      autoFocus
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Objet */}
                  <div className="mb-3">
                    <label className="form-label-modern">
                      <FaClipboardList
                        size={11}
                        style={{ marginRight: '6px', color: 'var(--gray-400)' }}
                      />
                      Objet associé{' '}
                      <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <select
                      className="form-control-modern"
                      value={formData.objet}
                      onChange={(e) =>
                        setFormData({ ...formData, objet: e.target.value })
                      }
                      style={{ width: '100%' }}
                    >
                      <option value="">Sélectionnez un objet</option>
                      {objets.map((objet) => (
                        <option key={objet._id} value={objet._id}>
                          {objet.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ordre */}
                  <div>
                    <label className="form-label-modern">
                      <FaSortNumericDown
                        size={11}
                        style={{ marginRight: '6px', color: 'var(--gray-400)' }}
                      />
                      Ordre d'affichage
                    </label>
                    <input
                      type="number"
                      className="form-control-modern"
                      placeholder="Ex: 1, 2, 3..."
                      value={formData.ordre}
                      onChange={(e) =>
                        setFormData({ ...formData, ordre: e.target.value })
                      }
                      min="0"
                      style={{ width: '100%' }}
                    />
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--gray-500)',
                        marginTop: '4px',
                      }}
                    >
                      💡 Plus le chiffre est petit, plus l'élément apparaît en
                      premier
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div
                  style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--gray-200)',
                    background: 'var(--gray-50)',
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-modern btn-modern-outline"
                  >
                    <FaTimes /> Annuler
                  </button>
                  <button type="submit" className="btn-modern btn-modern-primary">
                    <FaSave /> {editingItem ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM DELETE */}
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