import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form } from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaBoxes, FaTags,
  FaSearch, FaSave, FaTimes, FaCalendarAlt, FaSortNumericDown,
  FaTools, FaCheckCircle, FaUserCog,
} from 'react-icons/fa';
import { getCategories, createCategorie, updateCategorie, deleteCategorie } from '../../api/categories';
import { getFamilles } from '../../api/familles';
import { getUsers } from '../../api/users';   // ✅ AJOUT
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import { invalidateRefCache } from '../../utils/refCache';

// ✅ Rôles autorisés à être assignés à une catégorie
const ROLES_AUTORISES = ['REPARATEUR', 'COMMERCIAL'];

const CategoriesCRUD = () => {
  const [categories, setCategories] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [reparateursDisponibles, setReparateursDisponibles] = useState([]);   // ✅ AJOUT
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    famille: '',
    ordre: 0,
    reparateurs: [],   // ✅ AJOUT
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFamille, setFilterFamille] = useState('');
  const [searchReparateur, setSearchReparateur] = useState('');   // ✅ AJOUT

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, famillesRes, usersRes] = await Promise.all([
        getCategories(),
        getFamilles(),
        getUsers(),   // ✅ AJOUT
      ]);

      const sorted = [...categoriesRes.data].sort(
        (a, b) => (a.ordre || 0) - (b.ordre || 0) || (a.nom || '').localeCompare(b.nom || '')
      );
      setCategories(sorted);
      setFamilles(famillesRes.data);

      // ✅ Filtrer les users par rôle autorisé
      const filteredUsers = (usersRes.data || []).filter((u) =>
        ROLES_AUTORISES.includes((u.role || '').toUpperCase().trim())
      );
      setReparateursDisponibles(filteredUsers);
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

  // ============================================================
  // MODAL
  // ============================================================
  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFormData(
      item
        ? {
            nom: item.nom,
            famille: item.famille?._id || '',
            ordre: item.ordre ?? 0,
            // ✅ Charger les réparateurs (peut être peuplé ou ID)
            reparateurs: (item.reparateurs || []).map((r) =>
              typeof r === 'object' && r !== null ? r._id : r
            ),
          }
        : { nom: '', famille: '', ordre: 0, reparateurs: [] }
    );
    setSearchReparateur('');
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ nom: '', famille: '', ordre: 0, reparateurs: [] });
    setSearchReparateur('');
    setError('');
  };

  // ============================================================
  // TOGGLE RÉPARATEUR
  // ============================================================
  const handleToggleReparateur = (userId) => {
    setFormData((prev) => {
      const current = prev.reparateurs || [];
      const exists = current.some((id) => String(id) === String(userId));

      if (exists) {
        return {
          ...prev,
          reparateurs: current.filter((id) => String(id) !== String(userId)),
        };
      }
      return { ...prev, reparateurs: [...current, userId] };
    });
  };

  const handleSelectAll = () => {
    setFormData((prev) => ({
      ...prev,
      reparateurs: reparateursDisponibles.map((u) => u._id),
    }));
  };

  const handleDeselectAll = () => {
    setFormData((prev) => ({ ...prev, reparateurs: [] }));
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
    if (!formData.famille) {
      setError('La famille est obligatoire');
      return;
    }

    try {
      const payload = {
        nom: formData.nom.trim(),
        famille: formData.famille,
        ordre: Number(formData.ordre) || 0,
        reparateurs: formData.reparateurs || [],   // ✅ AJOUT
      };

      if (editingItem) {
        await updateCategorie(editingItem._id, payload);
        setSuccess('Catégorie modifiée avec succès');
      } else {
        await createCategorie(payload);
        setSuccess('Catégorie créée avec succès');
      }

      invalidateRefCache();
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
      await deleteCategorie(editingItem._id);
      invalidateRefCache();
      setSuccess('Catégorie supprimée avec succès');
      setShowDeleteDialog(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      setShowDeleteDialog(false);
    }
  };

  // ============================================================
  // RÉPARATEURS FILTRÉS (recherche dans le modal)
  // ============================================================
  const reparateursFiltres = useMemo(() => {
    if (!searchReparateur.trim()) return reparateursDisponibles;
    const term = searchReparateur.toLowerCase();
    return reparateursDisponibles.filter((u) => {
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const username = (u.username || '').toLowerCase();
      return fullName.includes(term) || username.includes(term);
    });
  }, [reparateursDisponibles, searchReparateur]);

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
    // ✅ NOUVELLE COLONNE : Réparateurs autorisés
    {
      name: 'Réparateurs',
      sortable: false,
      grow: 1,
      minWidth: '160px',
      cell: (row) => {
        const count = (row.reparateurs || []).length;
        if (count === 0) {
          return (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--gray-400)',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <FaCheckCircle size={10} /> Tous
            </span>
          );
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
            {(row.reparateurs || []).slice(0, 2).map((r, idx) => {
              const name =
                typeof r === 'object' && r !== null
                  ? `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.username
                  : '...';
              return (
                <span
                  key={idx}
                  style={{
                    padding: '2px 6px',
                    background: 'var(--info-light)',
                    color: 'var(--info)',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </span>
              );
            })}
            {count > 2 && (
              <span
                style={{
                  padding: '2px 6px',
                  background: 'var(--gray-200)',
                  color: 'var(--gray-700)',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: '700',
                }}
                title={(row.reparateurs || [])
                  .slice(2)
                  .map((r) =>
                    typeof r === 'object' && r !== null
                      ? `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.username
                      : ''
                  )
                  .join(', ')}
              >
                +{count - 2}
              </span>
            )}
          </div>
        );
      },
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

  // ============================================================
  // RENDER
  // ============================================================
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

      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
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

              {/* NOM */}
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

              {/* FAMILLE */}
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

              {/* ORDRE */}
              <div className="mb-3">
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

              {/* ✅ NOUVEAU : RÉPARATEURS AUTORISÉS */}
              <div className="mb-3">
                <label className="form-label-modern">
                  <FaUserCog size={11} style={{ marginRight: '6px', color: 'var(--gray-400)' }} />
                  Réparateurs autorisés
                  <span style={{ fontSize: '10px', color: 'var(--gray-500)', marginLeft: 8, fontWeight: 400 }}>
                    (aucun coché = tous les réparateurs)
                  </span>
                </label>

                {/* Barre de sélection rapide */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="btn-modern btn-modern-outline"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Tout sélectionner
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="btn-modern btn-modern-outline"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Tout désélectionner
                  </button>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      background: 'var(--primary-light)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    {formData.reparateurs?.length || 0} sélectionné(s)
                  </span>
                </div>

                {/* Recherche */}
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <FaSearch
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--gray-400)',
                      fontSize: '12px',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    className="form-control-modern"
                    style={{ paddingLeft: '36px', width: '100%', height: '38px', fontSize: '12.5px' }}
                    placeholder="Rechercher un réparateur..."
                    value={searchReparateur}
                    onChange={(e) => setSearchReparateur(e.target.value)}
                  />
                </div>

                {/* Liste des réparateurs */}
                <div
                  style={{
                    maxHeight: '240px',
                    overflowY: 'auto',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '10px',
                    padding: '8px',
                    background: 'white',
                  }}
                >
                  {reparateursFiltres.length > 0 ? (
                    reparateursFiltres.map((u) => {
                      const isChecked = (formData.reparateurs || []).some(
                        (id) => String(id) === String(u._id)
                      );
                      const initials = `${u.firstName?.charAt(0) || ''}${u.lastName?.charAt(0) || ''}`;
                      return (
                        <label
                          key={u._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: isChecked ? 'var(--primary-light)' : 'transparent',
                            marginBottom: '2px',
                            transition: 'background 100ms ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isChecked) e.currentTarget.style.background = 'var(--gray-50)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isChecked) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleReparateur(u._id)}
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: 'var(--primary)',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          />
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: isChecked
                                ? 'var(--primary)'
                                : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {initials || '?'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '12.5px',
                                fontWeight: isChecked ? 700 : 500,
                                color: isChecked ? 'var(--primary)' : 'var(--gray-800)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {u.firstName} {u.lastName}
                            </div>
                            <div
                              style={{
                                fontSize: '10px',
                                color: isChecked ? 'var(--primary)' : 'var(--gray-500)',
                                opacity: 0.85,
                              }}
                            >
                              {u.role === 'COMMERCIAL' ? '💼 Commercial' : '🔧 Réparateur'}
                            </div>
                          </div>
                          {isChecked && (
                            <FaCheckCircle size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          )}
                        </label>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: 'var(--gray-400)',
                        fontSize: '12px',
                      }}
                    >
                      Aucun réparateur trouvé
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '6px' }}>
                  💡 Si aucun réparateur n'est coché, tous les réparateurs seront disponibles dans le modal de réparation pour cette catégorie.
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