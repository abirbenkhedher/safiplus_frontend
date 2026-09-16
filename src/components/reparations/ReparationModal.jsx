import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';   // ✅ AJOUT
import { 
  FaTimes, FaUser, FaTools, FaMoneyBillWave, FaClipboardList,
  FaSave, FaPrint, FaHourglassHalf, FaCommentAlt, FaCamera
} from 'react-icons/fa';
import { createReparation, updateReparation } from '../../api/reparations';
import { useReparationData } from '../../hooks/useReparationData';
import { PANNES_STANDARD, DRAFT_KEY } from '../../constants/reparations';
import ClientSelector from './ClientSelector';
import SearchSelect from './SearchSelect';
import ObservationsList from './ObservationsList';
import PaymentSection from './PaymentSection';
import IMEIScannerModal from './IMEIScannerModal';

const INITIAL_FORM = {
  client: '', categorie: '', objet: '', marque: '', modele: '',
  numeroSerie: '', accessoires: '', problemeDeclare: '', panneType: '',
  note: '', prix: 0, acompte: 0, status: '', reparateur: '',
  paymentType: 'unpaid',
  observations: [{ text: '', date: new Date().toISOString() }],
};

const ReparationModal = ({ 
  show, 
  onClose, 
  onSuccess, 
  reparation = null, 
  initialClientId = null 
}) => {
  const isEdit = Boolean(reparation);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [showIMScanner, setShowIMScanner] = useState(false);

  const { categories, objets, statuses, reparateurs } = useReparationData();

  // ✅ Charger les données
  useEffect(() => {
    if (!show) return;

    if (isEdit && reparation) {
      setFormData({
        client: reparation.client?._id || '',
        categorie: reparation.categorie?._id || '',
        objet: reparation.objet?._id || '',
        marque: reparation.marque || '',
        modele: reparation.modele || '',
        numeroSerie: reparation.numeroSerie || '',
        accessoires: reparation.accessoires || '',
        problemeDeclare: reparation.problemeDeclare || '',
        panneType: reparation.panneType || '',
        note: reparation.note || '',
        prix: reparation.prix || 0,
        acompte: reparation.acompte || 0,
        status: reparation.status?._id || '',
        reparateur: reparation.reparateur?._id || '',
        paymentType: reparation.paymentType || 'unpaid',
        observations: reparation.observations?.length > 0 
          ? reparation.observations 
          : [{ text: '', date: new Date().toISOString() }],
      });
    } else if (!isEdit) {
      const draft = localStorage.getItem(DRAFT_KEY);
      
      if (draft && !initialClientId) {
        try {
          const parsed = JSON.parse(draft);
          if (!parsed.observations || parsed.observations.length === 0) {
            parsed.observations = [{ text: '', date: new Date().toISOString() }];
          }
          setFormData(parsed);
          setHasDraft(true);
        } catch (e) {
          setFormData({
            ...INITIAL_FORM,
            client: initialClientId || '',
          });
        }
      } else {
        setFormData({
          ...INITIAL_FORM,
          client: initialClientId || '',
          observations: [{ text: '', date: new Date().toISOString() }],
        });
      }
    }
    
    setError('');
    setSuccess('');
  }, [show, reparation, isEdit, initialClientId]);

  // ✅ Statut par défaut
  useEffect(() => {
    if (statuses.length === 0) return;
    if (isEdit) return;
    if (formData.status) return;

    const enAttente = statuses.find(s => 
      s.label.toLowerCase().includes('attente')
    );
    const defaultStatus = enAttente || statuses.find(s => s.parDefault) || statuses[0];

    if (defaultStatus) {
      setFormData(prev => ({ ...prev, status: defaultStatus._id }));
    }
  }, [statuses, isEdit, formData.status]);

  // ✅ Auto-save brouillon
  useEffect(() => {
    if (!isEdit && show) {
      const timer = setTimeout(() => {
        if (formData.client || formData.marque) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, isEdit, show]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (shouldPrint = false) => {
    setError('');
    setSuccess('');

        if (!formData.client) return setError('Le client est obligatoire');
    if (!formData.categorie) return setError('La catégorie est obligatoire');
    if (!formData.objet) return setError('L\'objet est obligatoire');
    if (!formData.marque.trim()) return setError('La marque est obligatoire');
    if (!formData.panneType) return setError('Le type de panne est obligatoire'); 
    if (!formData.note.trim()) return setError('La note est obligatoire');
    if (!formData.status) return setError('Le statut est obligatoire');

    setSaving(true);
    try {
      const cleanData = {
        ...formData,
        observations: formData.observations.filter(o => o.text.trim() !== ''),
      };

      const response = isEdit
        ? await updateReparation(reparation._id, cleanData)
        : await createReparation(cleanData);

      const saved = response.data;
      setSuccess(isEdit ? 'Réparation modifiée' : 'Réparation créée');

      if (!isEdit) localStorage.removeItem(DRAFT_KEY);

      if (shouldPrint && saved._id) {
        setTimeout(() => printTicket(saved._id), 500);
      }

      setTimeout(() => {
        onSuccess?.(saved);
        onClose();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const printTicket = async (reparationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/reparations/${reparationId}/ticket`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const html = await res.text();
      const win = window.open('', '_blank', 'width=400,height=600');
      win.document.write(html);
      win.document.close();
      win.onload = () => setTimeout(() => win.print(), 500);
    } catch (err) {
      console.error('Erreur impression:', err);
    }
  };

  // ✅ Raccourcis clavier
  useEffect(() => {
    if (!show) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && !saving && !showIMScanner) onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [show, saving, formData, showIMScanner]);

  if (!show) return null;

  const panneOptions = PANNES_STANDARD.map(p => ({
    value: p.value,
    label: p.label,
    icon: p.icon,
  }));

  // ✅ PORTAL : Rendu dans document.body
  return createPortal(
    <>
      <div 
        className="modal fade show d-block" 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)', 
          zIndex: 9999,
          overflowY: 'auto',
          padding: '40px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }} 
        onClick={(e) => {
          if (e.target === e.currentTarget && !saving) onClose();
        }}
      >
        <div 
          className="modal-dialog modal-dialog-centered modal-lg" 
          style={{ 
            maxWidth: '780px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <div className="modal-content" style={{
            border: 'none', borderRadius: '20px', overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          }}>
            
            {/* HEADER */}
            <div style={{
              padding: '18px 24px',
              background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.05) 0%, rgba(67, 97, 238, 0.02) 100%)',
              borderBottom: '1px solid var(--gray-200)',
              display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0,
            }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '17px', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
              }}>
                <FaTools />
              </div>
              <div style={{ flex: 1 }}>
                <h5 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
                  {isEdit ? `Modifier ${reparation?.numero}` : 'Nouvelle réparation'}
                </h5>
                <p style={{ fontSize: '11.5px', color: 'var(--gray-500)', margin: '2px 0 0' }}>
                  {isEdit ? 'Modifiez les informations' : 'Ctrl+S pour enregistrer'}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={saving}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: 'none', background: 'white', color: 'var(--gray-500)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* BODY */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              
              {hasDraft && !isEdit && (
                <div style={{
                  padding: '10px 14px', background: 'var(--warning-light)',
                  color: 'var(--warning)', borderRadius: '10px',
                  marginBottom: '16px', fontSize: '12px', fontWeight: '500',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                }}>
                  <span>📝 Brouillon récupéré</span>
                  <button
                    onClick={() => {
                      localStorage.removeItem(DRAFT_KEY);
                      setHasDraft(false);
                      setFormData({
                        ...INITIAL_FORM,
                        client: initialClientId || '',
                      });
                    }}
                    style={{
                      background: 'white', border: 'none', color: 'var(--warning)',
                      fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                      padding: '4px 10px', borderRadius: '6px',
                    }}
                  >
                    Effacer
                  </button>
                </div>
              )}

              {success && (
                <div style={{
                  padding: '10px 14px', background: 'var(--success-light)',
                  color: 'var(--success)', borderRadius: '10px',
                  marginBottom: '16px', fontSize: '12.5px', fontWeight: '500',
                }}>
                  ✅ {success}
                </div>
              )}
              {error && (
                <div style={{
                  padding: '10px 14px', background: 'var(--danger-light)',
                  color: 'var(--danger)', borderRadius: '10px',
                  marginBottom: '16px', fontSize: '12.5px', fontWeight: '500',
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* CLIENT */}
              <SectionBlock icon={<FaUser size={13} />} title="Client" color="var(--primary)">
                <ClientSelector
                  value={formData.client}
                  onChange={(id) => handleFieldChange('client', id)}
                />
              </SectionBlock>

              {/* APPAREIL */}
              <SectionBlock icon={<FaTools size={13} />} title="Appareil" color="var(--info)">
                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <label className="form-label-modern">
                      Catégorie <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <SearchSelect
                      options={categories.map(c => ({ value: c._id, label: c.nom }))}
                      value={formData.categorie}
                      onChange={(val) => handleFieldChange('categorie', val)}
                      placeholder="Rechercher..."
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label-modern">
                      Objet <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <SearchSelect
                      options={objets.map(o => ({ value: o._id, label: o.nom }))}
                      value={formData.objet}
                      onChange={(val) => handleFieldChange('objet', val)}
                      placeholder="Rechercher..."
                    />
                  </div>
                </div>

                <div className="row g-2" style={{ marginTop: '8px' }}>
                  <div className="col-12 col-sm-6">
                    <label className="form-label-modern">
                      Marque / Modèle <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.marque}
                      onChange={(e) => handleFieldChange('marque', e.target.value)}
                      placeholder="Ex: Samsung Galaxy S23"
                      className="form-control-modern"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label-modern">
                      IMEI / N° de série
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={formData.numeroSerie}
                        onChange={(e) => handleFieldChange('numeroSerie', e.target.value)}
                        placeholder="Ex: 352099001761481"
                        className="form-control-modern"
                        style={{ 
                          width: '100%', 
                          fontFamily: 'monospace',
                          paddingRight: '46px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowIMScanner(true)}
                        title="Scanner l'IMEI avec la caméra"
                        style={{
                          position: 'absolute',
                          right: '6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(67, 97, 238, 0.3)',
                          transition: 'all 150ms ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                        }}
                      >
                        <FaCamera size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </SectionBlock>

              {/* PANNE */}
              <SectionBlock icon={<FaClipboardList size={13} />} title="Panne" color="var(--warning)">
                <div className="row g-2">
                  {/* ✅ Type de panne : OBLIGATOIRE */}
                  <div className="col-12">
                    <label className="form-label-modern">
                      Type de panne <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <SearchSelect
                      options={panneOptions}
                      value={formData.panneType}
                      onChange={(val) => handleFieldChange('panneType', val)}
                      placeholder="Rechercher une panne..."
                    />
                  </div>

                  {/* ✅ Description : OPTIONNEL */}
                  <div className="col-12">
                    <label className="form-label-modern">
                      Description du problème <span style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: '400' }}>(optionnel)</span>
                    </label>
                    <textarea
                      value={formData.problemeDeclare}
                      onChange={(e) => handleFieldChange('problemeDeclare', e.target.value)}
                      rows={2}
                      placeholder="Décrivez le problème en détail..."
                      className="form-control-modern"
                      style={{ width: '100%', height: 'auto', padding: '10px 14px', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  {/* ✅ Note : OBLIGATOIRE */}
                  <div className="col-12">
                    <label className="form-label-modern">
                      Note interne <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <textarea
                      value={formData.note}
                      onChange={(e) => handleFieldChange('note', e.target.value)}
                      rows={2}
                      placeholder="Note obligatoire..."
                      className="form-control-modern"
                      style={{ width: '100%', height: 'auto', padding: '10px 14px', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              </SectionBlock>

              {/* PAIEMENT */}
              <SectionBlock icon={<FaMoneyBillWave size={13} />} title="Paiement" color="var(--success)">
                <PaymentSection formData={formData} onChange={setFormData} />
              </SectionBlock>

              {/* OBSERVATIONS */}
              <SectionBlock icon={<FaCommentAlt size={13} />} title="Observations" color="var(--gray-600)">
                <ObservationsList
                  observations={formData.observations}
                  onChange={(obs) => handleFieldChange('observations', obs)}
                />
              </SectionBlock>

              {/* GESTION */}
              <SectionBlock icon={<FaHourglassHalf size={13} />} title="Gestion" color="var(--primary)">
                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <label className="form-label-modern">
                      Statut <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className="form-control-modern"
                      style={{ width: '100%' }}
                    >
                      <option value="">Sélectionnez</option>
                      {statuses.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.label} {s.parDefault && '(défaut)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label-modern">Technicien</label>
                    <select
                      value={formData.reparateur}
                      onChange={(e) => handleFieldChange('reparateur', e.target.value)}
                      className="form-control-modern"
                      style={{ width: '100%' }}
                    >
                      <option value="">Non assigné</option>
                      {reparateurs.map(u => (
                        <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </SectionBlock>
            </div>

            {/* FOOTER */}
            <div style={{
              padding: '14px 24px',
              background: 'var(--gray-50)',
              borderTop: '1px solid var(--gray-200)',
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={saving}
                className="btn-modern btn-modern-outline"
                style={{ borderColor: 'var(--success)', color: 'var(--success)' }}
              >
                <FaPrint /> Enregistrer + Imprimer
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={saving}
                className="btn-modern btn-modern-primary"
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FaSave /> {isEdit ? 'Modifier' : 'Enregistrer'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <IMEIScannerModal
        show={showIMScanner}
        onClose={() => setShowIMScanner(false)}
        onScan={(imei) => {
          handleFieldChange('numeroSerie', imei);
          setShowIMScanner(false);
        }}
      />
    </>,
    document.body   // ✅ RENDU DIRECTEMENT DANS <body>
  );
};

// ✅ Composant Section réutilisable
const SectionBlock = ({ icon, title, color = 'var(--primary)', children }) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginBottom: '10px', paddingBottom: '8px',
      borderBottom: `1px solid ${color}20`,
    }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '8px',
        background: `${color}15`, color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <h6 style={{
        fontSize: '12px', fontWeight: '700', color: color,
        margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        {title}
      </h6>
    </div>
    {children}
  </div>
);

export default ReparationModal;