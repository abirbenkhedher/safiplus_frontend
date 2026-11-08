import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { FaStore, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import { getBoutiques, updateBoutique, toggleBoutiqueStatus } from '../../api/boutiques';
import { useAuth } from '../../context/AuthContext';

// ============================================================
// ✅ MULTI-TENANT : boutiques de la société (admin propriétaire)
// - l'admin modifie les infos de ses boutiques
// - la création / activation est faite par le SUPER_ADMIN (backoffice)
// ============================================================
const EMPTY = { nom: '', code: '', adresse: '', telephone: '', email: '' };

const Message = ({ type, children }) => (
  <div
    style={{
      padding: '12px 16px',
      background: type === 'error' ? 'var(--danger-light)' : 'var(--success-light)',
      color: type === 'error' ? 'var(--danger)' : 'var(--success)',
      borderRadius: '10px',
      marginBottom: '20px',
      fontSize: '13px',
      fontWeight: '500',
    }}
  >
    {type === 'error' ? '⚠️' : '✅'} {children}
  </div>
);

const BoutiquesCRUD = () => {
  const { isSuperAdmin, orgBoutiques } = useAuth();
  const superAdmin = isSuperAdmin();
  const orgIds = orgBoutiques.map((b) => b._id).join(',');
  const [boutiques, setBoutiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = () =>
    getBoutiques()
      .then((res) => {
        const ids = orgIds.split(',');
        // Le SUPER_ADMIN reçoit toutes les boutiques : on garde celles de la société en cours
        setBoutiques((res.data || []).filter((b) => !superAdmin || ids.includes(b._id)));
      })
      .catch((err) => setError(err.response?.data?.message || 'Erreur lors du chargement des boutiques'))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadData();
  }, []);

  const flash = (msg) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      nom: row.nom || '',
      code: row.code || '',
      adresse: row.adresse || '',
      telephone: row.telephone || '',
      email: row.email || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim()) {
      setFormError('Le nom est obligatoire');
      return;
    }
    try {
      setSaving(true);
      await updateBoutique(editing._id, form);
      flash('Boutique modifiée');
      setShowModal(false);
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (row) => {
    try {
      const res = await toggleBoutiqueStatus(row._id);
      flash(res.message);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const columns = [
    {
      name: '#',
      width: '40px',
      cell: (row, index) => index + 1,
    },
    {
      name: 'Boutique',
      selector: (row) => row.nom,
      sortable: true,
      grow: 2,
      minWidth: '200px',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaStore style={{ color: 'var(--primary)' }} />
          <strong>{row.nom}</strong>
        </div>
      ),
    },
    {
      name: 'Code',
      selector: (row) => row.code,
      width: '110px',
      cell: (row) => <span className="badge-modern badge-modern-gray">{row.code}</span>,
    },
    { name: 'Téléphone', selector: (row) => row.telephone || '—' },
    { name: 'Adresse', selector: (row) => row.adresse || '—', wrap: true },
    {
      name: 'Employés',
      selector: (row) => row.usersCount,
      width: '110px',
      sortable: true,
    },
    {
      name: 'Statut',
      width: '140px',
      cell: (row) => !superAdmin ? (
        <span className={`badge-modern ${row.isActive ? 'badge-modern-success' : 'badge-modern-gray'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => handleToggle(row)}
          className={`badge-modern ${row.isActive ? 'badge-modern-success' : 'badge-modern-gray'}`}
          style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          title={row.isActive ? 'Désactiver' : 'Activer'}
        >
          {row.isActive ? <FaToggleOn /> : <FaToggleOff />}
          {row.isActive ? 'Active' : 'Inactive'}
        </button>
      ),
    },
  ];

  const field = (key, label, props = {}) => (
    <div className="mb-3">
      <label className="form-label" style={{ fontSize: '13px', fontWeight: 600 }}>{label}</label>
      <input
        className="form-control-modern"
        style={{ width: '100%' }}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        {...props}
      />
    </div>
  );

  return (
    <div className="fade-in-up">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '4px' }}>
            Mes boutiques
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            {boutiques.length} boutique(s) dans votre société — pour ajouter une boutique,
            contactez l'administrateur de la plateforme.
          </p>
        </div>
      </div>

      {success && <Message>{success}</Message>}
      {error && <Message type="error">{error}</Message>}

      <DataTable
        columns={columns}
        data={boutiques}
        loading={loading}
        onEdit={openEdit}
        searchable={false}
        emptyMessage="Aucune boutique"
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '18px' }}>
              Modifier la boutique
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && <Message type="error">{formError}</Message>}
            {field('nom', 'Nom *', { autoFocus: true, placeholder: 'Ex : Boutique Sousse' })}
            <div className="mb-3" style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
              Code : <strong>{form.code}</strong> (non modifiable, préfixe des numéros de réparation)
            </div>
            {field('telephone', 'Téléphone')}
            {field('adresse', 'Adresse')}
            {field('email', 'Email', { type: 'email' })}
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn-modern btn-modern-outline" onClick={() => setShowModal(false)}>
              Annuler
            </button>
            <button type="submit" className="btn-modern btn-modern-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default BoutiquesCRUD;
