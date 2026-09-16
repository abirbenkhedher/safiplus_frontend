import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaClipboardList, FaSearch, FaSave, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import { getObjets, createObjet, updateObjet, deleteObjet } from '../../api/objets';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';

const ObjetsCRUD = () => {
  const [objets, setObjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ nom: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadObjets = async () => {
    try {
      setLoading(true);
      const response = await getObjets();
      setObjets(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des objets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObjets();
  }, []);

  const filteredObjets = useMemo(() => {
    if (!searchTerm) return objets;
    const term = searchTerm.toLowerCase();
    return objets.filter(o => o.nom?.toLowerCase().includes(term));
  }, [objets, searchTerm]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFormData(item ? { nom: item.nom } : { nom: '' });
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ nom: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }

    try {
      if (editingItem) {
        await updateObjet(editingItem._id, formData);
        setSuccess('Objet modifié avec succès');
      } else {
        await createObjet(formData);
        setSuccess('Objet créé avec succès');
      }
      handleCloseModal();
      loadObjets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteObjet(editingItem._id);
      setSuccess('Objet supprimé avec succès');
      setShowDeleteDialog(false);
      loadObjets();
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
        <span style={{ fontWeight: '600', color: 'var(--gray-500)' }}>{index + 1}</span>
      ),
    },
    {
      name: 'Nom',
      selector: (row) => row.nom,
      sortable: true,
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'var(--info-light)', color: 'var(--info)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', flexShrink: 0,
          }}>
            <FaClipboardList />
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
            Objets
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            {objets.length} objet(s) enregistré(s)
          </p>
        </div>
        <button className="btn-modern btn-modern-primary" onClick={() => handleOpenModal()}>
          <FaPlus /> Nouvel objet
        </button>
      </div>

      {success && (
        <div style={{ padding: '12px 16px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
          ✅ {success}
        </div>
      )}
      {error && !showModal && (
        <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="card-modern mb-4" style={{ padding: '16px' }}>
        <div style={{ position: 'relative' }}>
          <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '13px', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-control-modern"
            style={{ paddingLeft: '40px', width: '100%' }}
            placeholder="Rechercher un objet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredObjets}
        loading={loading}
        onEdit={(row) => handleOpenModal(row)}
        onDelete={(row) => { setEditingItem(row); setShowDeleteDialog(true); }}
        searchable={false}
        emptyMessage="Aucun objet enregistré"
        paginationPerPage={10}
      />

      {/* Modal */}
      <div className={`modal fade ${showModal ? 'show d-block' : ''}`} style={{ background: showModal ? 'rgba(0,0,0,0.5)' : 'transparent' }} tabIndex="-1">
        {showModal && (
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ border: 'none', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-200)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--info), #2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', flexShrink: 0 }}>
                  <FaClipboardList />
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                    {editingItem ? 'Modifier l\'objet' : 'Nouvel objet'}
                  </h5>
                  <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '2px 0 0' }}>
                    {editingItem ? 'Modifiez les informations ci-dessous' : 'Créez un nouvel objet'}
                  </p>
                </div>
                <button onClick={handleCloseModal} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'white', color: 'var(--gray-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ padding: '24px' }}>
                  {error && (
                    <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
                      ⚠️ {error}
                    </div>
                  )}
                  <label className="form-label-modern">
                    Nom de l'objet <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control-modern"
                    placeholder="Ex: Téléphone, PC portable..."
                    value={formData.nom}
                    onChange={(e) => setFormData({ nom: e.target.value })}
                    autoFocus
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--gray-200)', background: 'var(--gray-50)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={handleCloseModal} className="btn-modern btn-modern-outline">
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

      <ConfirmDialog
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer l'objet"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.nom}" ?`}
        confirmText="Supprimer"
      />
    </div>
  );
};

export default ObjetsCRUD;