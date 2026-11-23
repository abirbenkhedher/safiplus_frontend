import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { FaPlus, FaBuilding, FaToggleOn, FaToggleOff, FaStore, FaSignInAlt } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import {
  getOrganisations,
  createOrganisation,
  updateOrganisation,
  toggleOrganisationStatus,
} from '../../api/organisations';
import { createBoutique } from '../../api/boutiques';
import { useAuth } from '../../context/AuthContext';

// ============================================================
// ✅ MULTI-TENANT : BACKOFFICE du SUPER_ADMIN
// - créer les sociétés (+ 1re boutique + compte admin)
// - ajouter des boutiques à une société
// - entrer dans n'importe quelle boutique (clic sur la boutique)
// ============================================================
const EMPTY = {
  nom: '', telephone: '', email: '', adresse: '', maxBoutiques: 0, maxUtilisateurs: 0,
  modules: { atelier: true, commercial: true, achats: true }, // ✅ formule : modules souscrits
  abonnement: { offre: 'atelier_commerce', dateFin: '', note: '' },
  boutique: { nom: '', code: '' },
  owner: { username: '', password: '', firstName: '', lastName: '', email: '', phone: '' },
};

// ✅ Abonnement : offres et affichage de l'état
const OFFRES = [['essai', 'Essai'], ['atelier', 'Atelier'], ['atelier_commerce', 'Atelier + Commerce'], ['commerce', 'Boutique (sans atelier)'], ['sur_mesure', 'Sur mesure']];
// ✅ Modules de chaque offre (modifiables ensuite, offre « sur mesure »)
const MODULES_OFFRE = {
  essai: { atelier: true, commercial: true, achats: true },
  atelier: { atelier: true, commercial: false, achats: true },
  atelier_commerce: { atelier: true, commercial: true, achats: true },
  commerce: { atelier: false, commercial: true, achats: true },
};
const MODULES = [
  ['atelier', 'Atelier', 'réparations, pannes, statuts, rémunérations, suivi client'],
  ['commercial', 'Ventes', 'comptoir, devis & factures, règlements, caisse'],
  ['achats', 'Achats', "fournisseurs, commandes, factures d'achat"],
];
const isoLocal = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
/** Prolonge à partir de la date de fin (ou d'aujourd'hui si elle est passée / vide). */
const prolonger = (dateFin, mois) => {
  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  const base = dateFin && new Date(dateFin) > auj ? new Date(dateFin) : auj;
  base.setMonth(base.getMonth() + mois);
  return isoLocal(base);
};
const ETATS = {
  illimite: ['badge-modern-gray', 'Sans échéance'],
  actif: ['badge-modern-success', 'Actif'],
  bientot: ['badge-modern-warning', 'Fin proche'],
  grace: ['badge-modern-danger', 'Expiré (grâce)'],
  suspendu: ['badge-modern-danger', 'Lecture seule'],
};
const AbonnementBadge = ({ e }) => {
  if (!e) return '—';
  const [cls, lib] = ETATS[e.statut] || ETATS.illimite;
  return (
    <div style={{ lineHeight: 1.3 }}>
      <span className={`badge-modern ${cls}`}>{lib}</span>
      <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', marginTop: 2 }}>
        {e.offreLibelle}{e.dateFin ? ` · fin ${new Date(e.dateFin).toLocaleDateString('fr-FR')}` : ''}
      </div>
    </div>
  );
};

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

const Input = ({ label, value, onChange, ...props }) => (
  <div className="mb-3">
    <label className="form-label" style={{ fontSize: '13px', fontWeight: 600 }}>{label}</label>
    <input
      className="form-control-modern"
      style={{ width: '100%' }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-500)', margin: '8px 0 12px' }}>
    {children}
  </div>
);

const OrganisationsCRUD = () => {
  const { activeBoutique, changeBoutique } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Ajout de boutique à une organisation existante
  const [boutiqueFor, setBoutiqueFor] = useState(null);
  const [boutiqueForm, setBoutiqueForm] = useState({ nom: '', code: '', adresse: '', telephone: '' });

  // Retour au backoffice : on sort de la boutique dans laquelle on était entré
  useEffect(() => {
    if (activeBoutique) changeBoutique('');
  }, [activeBoutique]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = () =>
    getOrganisations()
      .then((res) => setOrgs(res.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Erreur lors du chargement'))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadData();
  }, []);

  const flash = (msg) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3500);
  };

  const set = (path, value) => {
    const [a, b] = path.split('.');
    setForm((f) => (b ? { ...f, [a]: { ...f[a], [b]: value } } : { ...f, [a]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      ...EMPTY,
      nom: row.nom || '',
      telephone: row.telephone || '',
      email: row.email || '',
      adresse: row.adresse || '',
      maxBoutiques: row.maxBoutiques || 0,
      maxUtilisateurs: row.maxUtilisateurs || 0,
      modules: { atelier: row.modules?.atelier !== false, commercial: row.modules?.commercial !== false, achats: row.modules?.achats !== false },
      abonnement: {
        offre: row.abonnement?.offre || 'atelier_commerce',
        dateFin: isoLocal(row.abonnement?.dateFin),
        note: row.abonnement?.note || '',
      },
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      setSaving(true);
      const base = {
        nom: form.nom,
        telephone: form.telephone,
        email: form.email,
        adresse: form.adresse,
        maxBoutiques: Number(form.maxBoutiques) || 0,
        maxUtilisateurs: Number(form.maxUtilisateurs) || 0,
        modules: { ...form.modules },
        abonnement: {
          offre: form.abonnement.offre,
          dateFin: form.abonnement.dateFin || null,
          note: form.abonnement.note,
        },
      };
      if (editing) {
        await updateOrganisation(editing._id, base);
        flash('Société modifiée');
      } else {
        await createOrganisation({ ...base, boutique: form.boutique, owner: form.owner });
        flash(`Société créée. Son admin peut se connecter avec "${form.owner.username}".`);
      }
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
      const res = await toggleOrganisationStatus(row._id);
      flash(res.message);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const handleAddBoutique = async (e) => {
    e.preventDefault();
    try {
      await createBoutique({
        organisation: boutiqueFor._id,
        nom: boutiqueForm.nom,
        code: boutiqueForm.code.trim() || undefined,
        adresse: boutiqueForm.adresse,
        telephone: boutiqueForm.telephone,
      });
      flash(`Boutique ajoutée à ${boutiqueFor.nom}`);
      setBoutiqueFor(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
      setBoutiqueFor(null);
    }
  };

  const columns = [
    {
      name: '#',
      width: '40px',
      cell: (row, index) => index + 1,
    },
    {
      name: 'Société',
      selector: (row) => row.nom,
      sortable: true,
      grow: 2,
      minWidth: '200px',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaBuilding style={{ color: 'var(--primary)' }} />
          <strong>{row.nom}</strong>
        </div>
      ),
    },
    {
      name: 'Admin propriétaire',
      cell: (row) => (row.owners || []).map((o) => `${o.firstName} ${o.lastName} (${o.username})`).join(', ') || '—',
      wrap: true,
    },
    {
      name: 'Boutiques',
      wrap: true,
      cell: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '6px 0', alignItems: 'center' }}>
          {(row.boutiques || []).map((b) => (
            <button
              type="button"
              key={b._id}
              className={`badge-modern ${b.isActive ? 'badge-modern-primary' : 'badge-modern-gray'}`}
              style={{
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                ...(b.isActive ? {} : { opacity: 0.5 }),
              }}
              title={`Entrer dans ${b.nom}${b.isActive ? '' : ' (inactive)'}`}
              onClick={() => changeBoutique(b._id, '/')}
            >
              <FaSignInAlt size={10} /> {b.nom} ({b.code})
            </button>
          ))}
          <button
            type="button"
            className="btn-modern btn-modern-outline"
            style={{ padding: '2px 8px', fontSize: '12px' }}
            onClick={() => {
              setBoutiqueFor(row);
              setBoutiqueForm({ nom: '', code: '', adresse: '', telephone: '' });
            }}
            title="Ajouter une boutique"
          >
            <FaPlus size={10} /> <FaStore size={11} />
          </button>
        </div>
      ),
    },
    {
      name: 'Utilisateurs',
      selector: (row) => row.usersCount,
      cell: (row) => `${row.usersCount}${row.maxUtilisateurs ? ` / ${row.maxUtilisateurs}` : ''}`,
      width: '120px',
    },
    {
      name: 'Abonnement',
      minWidth: '170px',
      sortable: true,
      selector: (row) => (row.abonnement?.dateFin ? new Date(row.abonnement.dateFin).getTime() : Infinity),
      cell: (row) => <AbonnementBadge e={row.etatAbonnement} />,
    },
    {
      name: 'Statut',
      width: '140px',
      cell: (row) => (
        <button
          type="button"
          onClick={() => handleToggle(row)}
          className={`badge-modern ${row.isActive ? 'badge-modern-success' : 'badge-modern-gray'}`}
          style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {row.isActive ? <FaToggleOn /> : <FaToggleOff />}
          {row.isActive ? 'Active' : 'Suspendue'}
        </button>
      ),
    },
  ];

  return (
    <div className="fade-in-up">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '4px' }}>
            Backoffice — Sociétés
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            {orgs.length} société(s) sur la plateforme · cliquez sur une boutique pour y entrer
          </p>
        </div>
        <button className="btn-modern btn-modern-primary" onClick={openCreate}>
          <FaPlus /> Nouvelle société
        </button>
      </div>

      {success && <Message>{success}</Message>}
      {error && <Message type="error">{error}</Message>}

      <DataTable
        columns={columns}
        data={orgs}
        loading={loading}
        onEdit={openEdit}
        searchable
        emptyMessage="Aucune société"
      />

      {/* Création / édition */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size={editing ? undefined : 'lg'}>
        <form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '18px' }}>
              {editing ? 'Modifier la société' : 'Nouvelle société'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && <Message type="error">{formError}</Message>}
            <div className="row">
              <div className={editing ? 'col-12' : 'col-md-6'}>
                <SectionTitle>Société</SectionTitle>
                <Input label="Nom *" value={form.nom} onChange={(v) => set('nom', v)} required autoFocus />
                <Input label="Téléphone" value={form.telephone} onChange={(v) => set('telephone', v)} />
                <Input label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} />
                <Input label="Adresse" value={form.adresse} onChange={(v) => set('adresse', v)} />
                <Input
                  label="Nombre max. de boutiques (0 = illimité)"
                  type="number"
                  min="0"
                  value={form.maxBoutiques}
                  onChange={(v) => set('maxBoutiques', v)}
                />
                <Input
                  label="Nombre max. d'utilisateurs actifs (0 = illimité)"
                  type="number"
                  min="0"
                  value={form.maxUtilisateurs}
                  onChange={(v) => set('maxUtilisateurs', v)}
                />
                <SectionTitle>Abonnement</SectionTitle>
                <div className="mb-3">
                  <label className="form-label" htmlFor="abo-offre" style={{ fontSize: '13px', fontWeight: 600 }}>Offre</label>
                  <select id="abo-offre" className="form-control-modern" style={{ width: '100%' }} value={form.abonnement.offre}
                    onChange={(e) => {
                      const offre = e.target.value;
                      set('abonnement.offre', offre);
                      // L'offre règle les modules (modifiables ensuite)
                      if (MODULES_OFFRE[offre]) set('modules', { ...MODULES_OFFRE[offre] });
                    }}>
                    {OFFRES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label" htmlFor="abo-fin" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Date de fin (dernier jour inclus, vide = sans échéance)
                  </label>
                  <input id="abo-fin" type="date" className="form-control-modern" style={{ width: '100%' }}
                    value={form.abonnement.dateFin} onChange={(e) => set('abonnement.dateFin', e.target.value)} />
                </div>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {[['+1 mois', 1], ['+3 mois', 3], ['+1 an', 12]].map(([l, m]) => (
                    <button key={l} type="button" className="btn-modern btn-modern-outline" style={{ padding: '3px 10px', fontSize: '12px' }}
                      onClick={() => set('abonnement.dateFin', prolonger(form.abonnement.dateFin, m))}>{l}</button>
                  ))}
                  <button type="button" className="btn-modern btn-modern-outline" style={{ padding: '3px 10px', fontSize: '12px' }}
                    onClick={() => set('abonnement.dateFin', '')}>Sans échéance</button>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: 12 }}>
                  Bandeau d'avertissement 7 jours avant la fin ; après la fin, 7 jours de grâce, puis lecture seule
                  (consultation et exports possibles, aucune modification).
                </div>
                <Input label="Note (paiement, contrat…)" value={form.abonnement.note} onChange={(v) => set('abonnement.note', v)} />
                {editing?.abonnement?.historique?.length > 0 && (
                  <details className="mb-3" style={{ fontSize: '12px' }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--gray-600)' }}>Historique de l'abonnement ({editing.abonnement.historique.length})</summary>
                    {[...editing.abonnement.historique].reverse().map((h, i) => (
                      <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--gray-100)' }}>
                        {new Date(h.date).toLocaleDateString('fr-FR')} · {(OFFRES.find(([v]) => v === h.offre) || [h.offre, h.offre])[1]}
                        {' · '}{h.dateFin ? `fin ${new Date(h.dateFin).toLocaleDateString('fr-FR')}` : 'sans échéance'}{h.note ? ` · ${h.note}` : ''}
                      </div>
                    ))}
                  </details>
                )}
                <SectionTitle>Modules</SectionTitle>
                {MODULES.map(([k, l, d]) => (
                  <div key={k} className="form-check form-switch mb-2">
                    <input id={`mod-${k}`} type="checkbox" role="switch" className="form-check-input"
                      checked={form.modules?.[k] !== false} onChange={(e) => set(`modules.${k}`, e.target.checked)} />
                    <label htmlFor={`mod-${k}`} className="form-check-label">
                      <b>{l}</b> <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>— {d}</span>
                    </label>
                  </div>
                ))}
                <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: 12 }}>
                  Toujours inclus : clients, stock, catalogue, dépenses, utilisateurs. Au moins Atelier ou Ventes.
                </div>
              </div>
              {!editing && (
                <div className="col-md-6">
                  <SectionTitle>Première boutique</SectionTitle>
                  <Input
                    label="Nom de la boutique"
                    placeholder="Par défaut : nom de la société"
                    value={form.boutique.nom}
                    onChange={(v) => set('boutique.nom', v)}
                  />
                  <Input
                    label="Code (optionnel)"
                    maxLength={8}
                    value={form.boutique.code}
                    onChange={(v) => set('boutique.code', v.toUpperCase())}
                  />
                  <SectionTitle>Compte admin de la société</SectionTitle>
                  <div className="row">
                    <div className="col-6">
                      <Input label="Prénom *" value={form.owner.firstName} onChange={(v) => set('owner.firstName', v)} required />
                    </div>
                    <div className="col-6">
                      <Input label="Nom *" value={form.owner.lastName} onChange={(v) => set('owner.lastName', v)} required />
                    </div>
                  </div>
                  <Input
                    label="Identifiant *"
                    value={form.owner.username}
                    onChange={(v) => set('owner.username', v)}
                    required
                    minLength={3}
                    autoComplete="off"
                  />
                  <Input
                    label="Mot de passe *"
                    type="password"
                    value={form.owner.password}
                    onChange={(v) => set('owner.password', v)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <Input label="Téléphone" value={form.owner.phone} onChange={(v) => set('owner.phone', v)} />
                </div>
              )}
            </div>
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

      {/* Ajout d'une boutique */}
      <Modal show={!!boutiqueFor} onHide={() => setBoutiqueFor(null)} centered>
        <form onSubmit={handleAddBoutique}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: '18px' }}>Nouvelle boutique — {boutiqueFor?.nom}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Input
              label="Nom *"
              value={boutiqueForm.nom}
              onChange={(v) => setBoutiqueForm((f) => ({ ...f, nom: v }))}
              required
              autoFocus
            />
            <Input
              label="Code (optionnel)"
              maxLength={8}
              value={boutiqueForm.code}
              onChange={(v) => setBoutiqueForm((f) => ({ ...f, code: v.toUpperCase() }))}
            />
            <Input
              label="Téléphone"
              value={boutiqueForm.telephone}
              onChange={(v) => setBoutiqueForm((f) => ({ ...f, telephone: v }))}
            />
            <Input
              label="Adresse"
              value={boutiqueForm.adresse}
              onChange={(v) => setBoutiqueForm((f) => ({ ...f, adresse: v }))}
            />
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn-modern btn-modern-outline" onClick={() => setBoutiqueFor(null)}>
              Annuler
            </button>
            <button type="submit" className="btn-modern btn-modern-primary">Ajouter</button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default OrganisationsCRUD;
