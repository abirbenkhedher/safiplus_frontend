import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaStar, FaCog, FaSearch, FaSave, FaTimes, FaCheck, FaRegCircle } from 'react-icons/fa';
import { getStatuses, createStatus, updateStatus, deleteStatus, setDefaultStatus } from '../../api/statuses';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';

const StatusesCRUD = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    label: '', parDefault: false, order: 0,
    color: '#6c757d', isTerminal: false, isEditableByReparateur: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const response = await getStatuses();
      setStatuses(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des statuts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const filteredStatuses = useMemo(() => {
    if (!searchTerm) return statuses;
    const term = searchTerm.toLowerCase();
    return statuses.filter(s => s.label?.toLowerCase().includes(term));
  }, [statuses, searchTerm]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFormData(item ? {
      label: item.label,
      parDefault: item.parDefault,
      order: item.order || 0,
      color: item.color || '#6c757d',
      isTerminal: item.isTerminal || false,
      isEditableByReparateur: item.isEditableByReparateur !== undefined ? item.isEditableByReparateur : true,
    } : {
      label: '', parDefault: false, order: 0,
      color: '#6c757d', isTerminal: false, isEditableByReparateur: true,
    });
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      label: '', parDefault: false, order: 0,
      color: '#6c757d', isTerminal: false, isEditableByReparateur: true,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.label.trim()) {
      setError('Le libellé est obligatoire');
      return;
    }

    try {
      if (editingItem) {
        await updateStatus(editingItem._id, formData);
        setSuccess('Statut modifié avec succès');
      } else {
        await createStatus(formData);
        setSuccess('Statut créé avec succès');
      }
      handleCloseModal();
      loadStatuses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleSetDefault = async (item) => {
    try {
      await setDefaultStatus(item._id);
      setSuccess(`"${item.label}" est maintenant le statut par défaut`);
      loadStatuses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStatus(editingItem._id);
      setSuccess('Statut supprimé avec succès');
      setShowDeleteDialog(false);
      loadStatuses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      setShowDeleteDialog(false);
    }
  };

  const colorOptions = [
    '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14', '#0d6efd', '#198754',
    '#dc3545', '#20c997', '#28a745', '#6c757d', '#e83e8c', '#6610f2',
  ];

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
      name: 'Libellé',
      selector: (row) => row.label,
      sortable: true,
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: row.color || '#6c757d',
            boxShadow: `0 0 0 3px ${row.color}33`,
            flexShrink: 0,
          }} />
          <strong style={{ color: 'var(--gray-800)' }}>{row.label}</strong>
        </div>
      ),
    },
    {
      name: 'Couleur',
      selector: (row) => row.color,
      center: true,
      width: '120px',
      cell: (row) => (
        <span className="badge-modern" style={{ background: row.color, color: 'white' }}>
          {row.color}
        </span>
      ),
    },
    {
      name: 'Par défaut',
      selector: (row) => row.parDefault,
      center: true,
      width: '120px',
      cell: (row) => (
        row.parDefault ? (
          <span className="badge-modern badge-modern-warning">
            <FaStar size={10} /> Défaut
          </span>
        ) : (
          <button
            onClick={() => handleSetDefault(row)}
            style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: '600',
              background: 'white', border: '1px solid var(--gray-300)',
              borderRadius: '6px', cursor: 'pointer', color: 'var(--gray-600)',
            }}
          >
            Définir
          </button>
        )
      ),
    },
    {
      name: 'Terminal',
      selector: (row) => row.isTerminal,
      center: true,
      width: '100px',
      cell: (row) => (
        <span className={`badge-modern ${row.isTerminal ? 'badge-modern-danger' : 'badge-modern-gray'}`}>
          {row.isTerminal ? 'Oui' : 'Non'}
        </span>
      ),
    },
    {
      name: 'Ordre',
      selector: (row) => row.order,
      sortable: true,
      center: true,
      width: '80px',
      cell: (row) => (
        <span style={{ fontWeight: '600', color: 'var(--gray-600)' }}>{row.order}</span>
      ),
    },
  ];

  return (
    <div className="fade-in-up">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '4px' }}>
            Statuts
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            {statuses.length} statut(s) enregistré(s)
          </p>
        </div>
        <button className="btn-modern btn-modern-primary" onClick={() => handleOpenModal()}>
          <FaPlus /> Nouveau statut
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
            placeholder="Rechercher un statut..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredStatuses}
        loading={loading}
        onEdit={(row) => handleOpenModal(row)}
        onDelete={(row) => { setEditingItem(row); setShowDeleteDialog(true); }}
        searchable={false}
        emptyMessage="Aucun statut enregistré"
        paginationPerPage={10}
      />

      {/* Modal */}
      <div className={`modal fade ${showModal ? 'show d-block' : ''}`} style={{ background: showModal ? 'rgba(0,0,0,0.5)' : 'transparent' }} tabIndex="-1">
        {showModal && (
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ border: 'none', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-200)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--warning), #d97706)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)', flexShrink: 0 }}>
                  <FaCog />
                </div>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                    {editingItem ? 'Modifier le statut' : 'Nouveau statut'}
                  </h5>
                  <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '2px 0 0' }}>
                    {editingItem ? 'Modifiez les informations ci-dessous' : 'Créez un nouveau statut'}
                  </p>
                </div>
                <button onClick={handleCloseModal} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'white', color: 'var(--gray-500)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                  {error && (
                    <div style={{ padding: '12px 16px', background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label-modern">Libellé <span style={{ color: 'var(--danger)' }}>*</span></label>
                      <input
                        type="text"
                        className="form-control-modern"
                        placeholder="Ex: En attente..."
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        autoFocus
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label-modern">Ordre d'affichage</label>
                      <input
                        type="number"
                        className="form-control-modern"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label-modern">Couleur</label>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {colorOptions.map((color) => (
                          <div
                            key={color}
                            onClick={() => setFormData({ ...formData, color })}
                            style={{
                              width: '36px', height: '36px', borderRadius: '10px',
                              backgroundColor: color, cursor: 'pointer',
                              border: formData.color === color ? '3px solid var(--gray-900)' : '3px solid transparent',
                              transition: 'all 150ms ease',
                              boxShadow: formData.color === color ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                            }}
                          />
                        ))}
                      </div>
                      <input
                        type="text"
                        className="form-control-modern"
                        placeholder="#hexadecimal"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div className="col-12">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { key: 'parDefault', label: 'Statut par défaut', desc: 'Ce statut sera sélectionné automatiquement lors de la création' },
                          { key: 'isTerminal', label: 'Statut terminal (final)', desc: 'Le statut ne peut plus être modifié après' },
                          { key: 'isEditableByReparateur', label: 'Modifiable par le réparateur', desc: 'Le réparateur peut changer vers ce statut' },
                        ].map(({ key, label, desc }) => (
                          <label
                            key={key}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: '12px',
                              padding: '14px 16px',
                              background: formData[key] ? 'var(--primary-light)' : 'var(--gray-50)',
                              borderRadius: '10px', cursor: 'pointer',
                              transition: 'all 150ms ease',
                              border: `1px solid ${formData[key] ? 'var(--primary)' : 'transparent'}`,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData[key]}
                              onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                              style={{ marginTop: '2px', accentColor: 'var(--primary)' }}
                            />
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--gray-800)' }}>
                                {label}
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', marginTop: '2px' }}>
                                {desc}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
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
        title="Supprimer le statut"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.label}" ?`}
        confirmText="Supprimer"
      />
    </div>
  );
};

export default StatusesCRUD;