import React, { useState, useEffect, useMemo } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaMobileAlt, FaSearch, FaSave,
  FaTimes, FaCalendarAlt, FaSortNumericDown, FaTrademark
} from 'react-icons/fa';
import {
  getModeles,
  createModele,
  updateModele,
  deleteModele,
} from '../../api/modeles';
import { getMarques } from '../../api/marques';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';

const ModelesCRUD = () => {
  const [modeles, setModeles] = useState([]);
  const [marques, setMarques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ nom: '', marque: '', ordre: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMarque, setFilterMarque] = useState('');

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const loadData = async () => {
    try {
      setLoading(true);
      const [modelesRes, marquesRes] = await Promise.all([
        getModeles(),
        getMarques(),
      ]);

      // ✅ Tri par ordre
      const sorted = [...modelesRes.data].sort(
        (a, b) => (a.ordre || 0) - (b.ordre || 0)
      );
      setModeles(sorted);
      setMarques(marquesRes.data);
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
        const marqueId =
          typeof m.marque === 'object' && m.marque !== null
            ? m.marque._id
            : m.marque;
        return marqueId === filterMarque;
      });
    }

    return result;
  }, [modeles, searchTerm, filterMarque]);

  // ============================================================
  // MODAL
  // ============================================================
  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFormData(
      item
        ? {
            nom: item.nom,
            marque:
              typeof item.marque === 'object' && item.marque !== null
                ? item.marque._id
                : item.marque || '',
            ordre: item.ordre ?? 0,
          }
        : { nom: '', marque: '', ordre: 0 }
    );
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ nom: '', marque: '', ordre: 0 });
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
    if (!formData.marque) {
      setError('La marque est obligatoire');
      return;
    }

    try {
      const payload = {
        nom: formData.nom.trim(),
        marque: formData.marque,
        ordre: Number(formData.ordre) || 0,
      };

      if (editingItem) {
        await updateModele(editingItem._id, payload);
        setSuccess('Modèle modifié avec succès');
      } else {
        await createModele(payload);
        setSuccess('Modèle créé avec succès');
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
              background: 'var(--info-light)',
              color: 'var(--info)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              flexShrink: 0,
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
            Modèles
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            {modeles.length} modèle(s) enregistré(s)
          </p>
        </div>
        <button
          className="btn-modern btn-modern-primary"
          onClick={() => handleOpenModal()}
        >
          <FaPlus /> Nouveau modèle
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
              {marques.map((marque) => (
                <option key={marque._id} value={marque._id}>
                  {marque.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <DataTable
        columns={columns}
        data={filteredModeles}
        loading={loading}
        onEdit={(row) => handleOpenModal(row)}
        onDelete={(row) => {
          setEditingItem(row);
          setShowDeleteDialog(true);
        }}
        searchable={false}
        emptyMessage="Aucun modèle enregistré"
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
                    'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
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
                    background: 'linear-gradient(135deg, var(--info), #2563eb)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  <FaMobileAlt />
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
                    {editingItem ? 'Modifier le modèle' : 'Nouveau modèle'}
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
                      : 'Créez un nouveau modèle'}
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
                      Nom du modèle{' '}
                      <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control-modern"
                      placeholder="Ex: Galaxy S23, iPhone 15..."
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData({ ...formData, nom: e.target.value })
                      }
                      autoFocus
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Marque */}
                  <div className="mb-3">
                    <label className="form-label-modern">
                      <FaTrademark
                        size={11}
                        style={{ marginRight: '6px', color: 'var(--gray-400)' }}
                      />
                      Marque associée{' '}
                      <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <select
                      className="form-control-modern"
                      value={formData.marque}
                      onChange={(e) =>
                        setFormData({ ...formData, marque: e.target.value })
                      }
                      style={{ width: '100%' }}
                    >
                      <option value="">Sélectionnez une marque</option>
                      {marques.map((marque) => (
                        <option key={marque._id} value={marque._id}>
                          {marque.nom}
                          {marque.objet?.nom ? ` (${marque.objet.nom})` : ''}
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
        title="Supprimer le modèle"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
      />
    </div>
  );
};

export default ModelesCRUD;