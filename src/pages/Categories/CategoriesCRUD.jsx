import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form } from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaBoxes, FaTags,
  FaSearch, FaSave, FaTimes, FaCalendarAlt, FaSortNumericDown
} from 'react-icons/fa';
import { getCategories, createCategorie, updateCategorie, deleteCategorie } from '../../api/categories';
import { getFamilles } from '../../api/familles';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';

const CategoriesCRUD = () => {
  const [categories, setCategories] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  // ✅ Ajout du champ ordre
  const [formData, setFormData] = useState({ nom: '', famille: '', ordre: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamille, setFilterFamille] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, famillesRes] = await Promise.all([
        getCategories(),
        getFamilles()
      ]);
      // ✅ Trier par ordre
      const sorted = [...categoriesRes.data].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
      setCategories(sorted);
      setFamilles(famillesRes.data);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.nom?.toLowerCase().includes(term) ||
        c.famille?.nom?.toLowerCase().includes(term)
      );
    }

    if (filterFamille) {
      result = result.filter(c => c.famille?._id === filterFamille);
    }

    return result;
  }, [categories, searchTerm, filterFamille]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFormData(
      item
        ? { nom: item.nom, famille: item.famille?._id || '', ordre: item.ordre ?? 0 }
        : { nom: '', famille: '', ordre: 0 }
    );
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ nom: '', famille: '', ordre: 0 });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    if (!formData.famille) {
      setError('La famille est obligatoire');
      return;
    }

    try {
      const payload = {
        nom: formData.nom.trim(),
        famille: formData.famille,
        ordre: Number(formData.ordre) || 0,
      };

      if (editingItem) {
        await updateCategorie(editingItem._id, payload);
        setSuccess('Catégorie modifiée avec succès');
      } else {
        await createCategorie(payload);
        setSuccess('Catégorie créée avec succès');
      }
      handleCloseModal();
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategorie(editingItem._id);
      setSuccess('Catégorie supprimée avec succès');
      setShowDeleteDialog(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      setShowDeleteDialog(false);
    }
  };

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
    // ✅ Colonne ORDRE
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
            <FaBoxes />
          </div>
          <strong style={{ color: 'var(--gray-800)' }}>{row.nom}</strong>
        </div>
      ),
    },
    {
      name: 'Famille',
      selector: (row) => row.famille?.nom,
      sortable: true,
      cell: (row) => (
        <span className="badge-modern badge-modern-primary">
          <FaTags size={10} />
          {row.famille?.nom || 'N/A'}
        </span>
      ),
    },
    {
      name: 'Date de création',
      selector: (row) => row.createdAt,
      sortable: true,
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-500)', fontSize: '12.5px' }}>
          <FaCalendarAlt size={11} />
          {new Date(row.createdAt).toLocaleDateString('fr-FR')}
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in-up">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '4px' }}>
            Catégories
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            {categories.length} catégorie(s) enregistrée(s)
          </p>
        </div>
        <button className="btn-modern btn-modern-primary" onClick={() => handleOpenModal()}>
          <FaPlus /> Nouvelle catégorie
        </button>
      </div>

      {success && (
        <div style={{ padding: '12px 16px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✅ {success}
        </div>
      )}
      {error && !showModal && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚠️ {error}
        </div>
      )}

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
                placeholder="Rechercher une catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-control-modern"
              style={{ width: '100%' }}
              value={filterFamille}
              onChange={(e) => setFilterFamille(e.target.value)}
            >
              <option value="">Toutes les familles</option>
              {familles.map((famille) => (
                <option key={famille._id} value={famille._id}>
                  {famille.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCategories}
        loading={loading}
        onEdit={(row) => handleOpenModal(row)}
        onDelete={(row) => {
          setEditingItem(row);
          setShowDeleteDialog(true);
        }}
        searchable={false}
        emptyMessage="Aucune catégorie enregistrée"
        paginationPerPage={10}
      />

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Body style={{ padding: 0 }}>
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--gray-200)',
              background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.05) 0%, rgba(67, 97, 238, 0.02) 100%)',
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
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
                flexShrink: 0,
              }}
            >
              <FaBoxes />
            </div>
            <div style={{ flex: 1 }}>
              <h5 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                {editingItem ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h5>
              <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '2px 0 0' }}>
                {editingItem ? 'Modifiez les informations ci-dessous' : 'Remplissez les informations'}
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
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--danger-light)';
                e.currentTarget.style.color = 'var(--danger)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = 'var(--gray-500)';
              }}
            >
              <FaTimes />
            </button>
          </div>

          <Form onSubmit={handleSubmit}>
            <div style={{ padding: '24px' }}>
              {error && (
                <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Nom */}
              <div className="mb-3">
                <label className="form-label-modern">
                  Nom de la catégorie <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control-modern"
                  placeholder="Ex: Smartphone, PC Portable..."
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  autoFocus
                  style={{ width: '100%' }}
                />
              </div>

              {/* Famille */}
              <div className="mb-3">
                <label className="form-label-modern">
                  <FaTags size={11} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
                  Famille <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  className="form-control-modern"
                  value={formData.famille}
                  onChange={(e) => setFormData({ ...formData, famille: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">Sélectionnez une famille</option>
                  {familles.map((famille) => (
                    <option key={famille._id} value={famille._id}>
                      {famille.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ Ordre */}
              <div>
                <label className="form-label-modern">
                  <FaSortNumericDown size={11} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  className="form-control-modern"
                  placeholder="Ex: 1, 2, 3..."
                  value={formData.ordre}
                  onChange={(e) => setFormData({ ...formData, ordre: e.target.value })}
                  min="0"
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '4px' }}>
                  💡 Plus le chiffre est petit, plus l'élément apparaît en premier
                </div>
              </div>
            </div>

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
              <button type="button" onClick={handleCloseModal} className="btn-modern btn-modern-outline">
                <FaTimes /> Annuler
              </button>
              <button type="submit" className="btn-modern btn-modern-primary">
                <FaSave /> {editingItem ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <ConfirmDialog
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer la catégorie"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
      />
    </div>
  );
};

export default CategoriesCRUD;