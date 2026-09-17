import React from 'react';
import {
  FaPlus, FaTrash, FaCheck, FaTimes, FaClock,
  FaExclamationTriangle, FaStethoscope, FaMoneyBillWave,
} from 'react-icons/fa';

const DiagnosticSection = ({ diagnostic = {}, onChange, prixInitial = 0, acompte = 0 }) => {
  const safeDiag = {
    constat: diagnostic.constat || '',
    imprevus: diagnostic.imprevus || [],
  };

  const update = (patch) => {
    onChange({ ...safeDiag, ...patch });
  };

  const addImprevu = () => {
    update({
      imprevus: [
        ...safeDiag.imprevus,
        { description: '', prixSupplementaire: 0, accepte: null, noteDecision: '' }
      ]
    });
  };

  const updateImprevu = (index, patch) => {
    const next = [...safeDiag.imprevus];
    next[index] = { ...next[index], ...patch };
    update({ imprevus: next });
  };

  const removeImprevu = (index) => {
    update({ imprevus: safeDiag.imprevus.filter((_, i) => i !== index) });
  };

  // ✅ Calculs
  const imprevusAcceptes = safeDiag.imprevus
    .filter(i => i.accepte === true)
    .reduce((s, i) => s + (Number(i.prixSupplementaire) || 0), 0);

  const imprevusEnAttente = safeDiag.imprevus
    .filter(i => i.accepte === null || i.accepte === undefined).length;

  const prixTotal = (Number(prixInitial) || 0) + imprevusAcceptes;
  const resteTotal = Math.max(0, prixTotal - (Number(acompte) || 0));

  return (
    <div>
      {/* CONSTAT DU RÉPARATEUR */}
      <div style={{ marginBottom: '16px' }}>
        <label className="form-label-modern">
          <FaStethoscope size={11} style={{ marginRight: '6px' }} />
          Constat du réparateur
          <span style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: '400', marginLeft: '6px' }}>
            (optionnel)
          </span>
        </label>
        <textarea
          value={safeDiag.constat}
          onChange={(e) => update({ constat: e.target.value })}
          rows={2}
          placeholder="Ex: Écran fissuré + batterie gonflée détectée..."
          className="form-control-modern"
          style={{ width: '100%', height: 'auto', padding: '10px 14px', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      {/* IMPRÉVUS */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '10px',
        }}>
          <label className="form-label-modern" style={{ margin: 0 }}>
            <FaExclamationTriangle size={11} style={{ marginRight: '6px', color: 'var(--warning)' }} />
            Imprévus découverts
            {imprevusEnAttente > 0 && (
              <span style={{
                marginLeft: '8px', padding: '2px 8px', borderRadius: '10px',
                background: 'var(--warning-light)', color: 'var(--warning)',
                fontSize: '10.5px', fontWeight: '700',
              }}>
                {imprevusEnAttente} en attente
              </span>
            )}
          </label>
          <button
            type="button"
            onClick={addImprevu}
            className="btn-modern btn-modern-outline"
            style={{ fontSize: '11.5px', padding: '6px 12px' }}
          >
            <FaPlus size={10} /> Ajouter un imprévu
          </button>
        </div>

        {safeDiag.imprevus.length === 0 ? (
          <div style={{
            padding: '14px', textAlign: 'center', fontSize: '12px',
            color: 'var(--gray-500)', background: 'var(--gray-50)',
            borderRadius: '10px', border: '1px dashed var(--gray-300)',
          }}>
            Aucun imprévu. Ajoutez-en un si vous découvrez une 2ème panne.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {safeDiag.imprevus.map((imp, index) => (
              <ImprevuItem
                key={index}
                index={index}
                imprevu={imp}
                onUpdate={(patch) => updateImprevu(index, patch)}
                onRemove={() => removeImprevu(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ RÉCAP PRIX DYNAMIQUE */}
      {(safeDiag.imprevus.length > 0 || prixInitial > 0) && (
        <div style={{
          marginTop: '14px',
          padding: '14px 16px',
          background: 'linear-gradient(135deg, var(--primary-light), white)',
          borderRadius: '12px',
          border: '1px solid var(--primary)40',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            paddingBottom: '8px', borderBottom: '1px dashed var(--gray-200)',
          }}>
            <FaMoneyBillWave size={12} style={{ color: 'var(--primary)' }} />
            <span style={{
              fontSize: '11px', fontWeight: '700', color: 'var(--primary)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Récapitulatif du prix
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--gray-600)' }}>Prix initial</span>
            <strong style={{ color: 'var(--gray-800)' }}>
              {(Number(prixInitial) || 0).toFixed(2)} DT
            </strong>
          </div>

          {imprevusAcceptes > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <span style={{ color: 'var(--success)' }}>
                + Imprévus acceptés ({safeDiag.imprevus.filter(i => i.accepte === true).length})
              </span>
              <strong style={{ color: 'var(--success)' }}>
                + {imprevusAcceptes.toFixed(2)} DT
              </strong>
            </div>
          )}

          {imprevusEnAttente > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'var(--warning)', fontStyle: 'italic' }}>
                ⏳ {imprevusEnAttente} imprévu(s) en attente
              </span>
              <span style={{ color: 'var(--warning)', fontStyle: 'italic' }}>
                non comptabilisé
              </span>
            </div>
          )}

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '8px', borderTop: '1px dashed var(--gray-200)',
          }}>
            <span style={{
              fontSize: '11px', fontWeight: '700', color: 'var(--primary)',
              textTransform: 'uppercase', letterSpacing: '0.3px',
            }}>
              💰 Prix total
            </span>
            <strong style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
              {prixTotal.toFixed(2)} DT
            </strong>
          </div>

          {Number(acompte) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <span style={{ color: 'var(--gray-600)' }}>Acompte versé</span>
              <strong style={{ color: 'var(--success)' }}>
                - {(Number(acompte) || 0).toFixed(2)} DT
              </strong>
            </div>
          )}

          {Number(acompte) > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: '8px', borderTop: '1px dashed var(--gray-200)',
            }}>
              <span style={{
                fontSize: '11px', fontWeight: '700',
                color: resteTotal > 0 ? 'var(--danger)' : 'var(--success)',
                textTransform: 'uppercase', letterSpacing: '0.3px',
              }}>
                Reste à payer
              </span>
              <strong style={{
                fontSize: '15px', fontWeight: '800',
                color: resteTotal > 0 ? 'var(--danger)' : 'var(--success)',
              }}>
                {resteTotal.toFixed(2)} DT
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===== SOUS-COMPOSANT : UN IMPRÉVU =====
const ImprevuItem = ({ index, imprevu, onUpdate, onRemove }) => {
  const decision = imprevu.accepte === true ? 'accepte'
                 : imprevu.accepte === false ? 'refuse'
                 : 'en_attente';

  const setDecision = (val) => {
    const accepte = val === 'accepte' ? true : val === 'refuse' ? false : null;
    onUpdate({ accepte });
  };

  return (
    <div style={{
      padding: '12px',
      background: 'white',
      border: '1px solid var(--gray-200)',
      borderRadius: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <div style={{
          minWidth: '26px', height: '26px', borderRadius: '6px',
          background: 'var(--warning-light)', color: 'var(--warning)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10.5px', fontWeight: '700', flexShrink: 0, marginTop: '8px',
        }}>
          #{index + 1}
        </div>
        <input
          type="text"
          value={imprevu.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Description de l'imprévu (ex: Batterie gonflée)"
          className="form-control-modern"
          style={{ flex: 1, minWidth: 0 }}
        />
        <input
          type="number"
          value={imprevu.prixSupplementaire || 0}
          onChange={(e) => onUpdate({ prixSupplementaire: parseFloat(e.target.value) || 0 })}
          min="0"
          step="0.01"
          placeholder="0.00"
          className="form-control-modern"
          style={{ width: '100px', fontSize: '14px', fontWeight: '600', textAlign: 'right' }}
        />
        <span style={{
          fontSize: '12px', color: 'var(--gray-500)', fontWeight: '600',
          alignSelf: 'center', whiteSpace: 'nowrap',
        }}>
          DT
        </span>
        <button
          type="button"
          onClick={onRemove}
          style={{
            width: '42px', height: '42px', borderRadius: '8px',
            border: 'none', background: 'var(--danger-light)',
            color: 'var(--danger)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          title="Supprimer"
        >
          <FaTrash size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px', paddingLeft: '34px' }}>
        <DecisionButton
          active={decision === 'en_attente'}
          color="#f59e0b"
          icon={<FaClock size={10} />}
          label="En attente"
          onClick={() => setDecision('en_attente')}
        />
        <DecisionButton
          active={decision === 'accepte'}
          color="#10b981"
          icon={<FaCheck size={10} />}
          label="Accepté"
          onClick={() => setDecision('accepte')}
        />
        <DecisionButton
          active={decision === 'refuse'}
          color="#ef4444"
          icon={<FaTimes size={10} />}
          label="Refusé"
          onClick={() => setDecision('refuse')}
        />
      </div>

      {decision !== 'en_attente' && (
        <input
          type="text"
          value={imprevu.noteDecision || ''}
          onChange={(e) => onUpdate({ noteDecision: e.target.value })}
          placeholder="Note (ex: Accepté par téléphone)"
          className="form-control-modern"
          style={{ marginLeft: '34px', fontSize: '12px', padding: '8px 12px' }}
        />
      )}
    </div>
  );
};

const DecisionButton = ({ active, color, icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '6px 12px',
      borderRadius: '8px',
      border: active ? `2px solid ${color}` : '1px solid var(--gray-200)',
      background: active ? `${color}15` : 'white',
      color: active ? color : 'var(--gray-500)',
      fontSize: '11.5px',
      fontWeight: active ? '700' : '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'all 150ms ease',
    }}
  >
    {icon} {label}
  </button>
);

export default DiagnosticSection;