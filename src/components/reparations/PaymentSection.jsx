import React from 'react';
import { FaMoneyBillWave, FaPlusCircle } from 'react-icons/fa';
import { PAYMENT_TYPES } from '../../constants/reparations';

const PaymentSection = ({ formData, onChange }) => {
  // ✅ Calcul des imprévus acceptés
  const imprevusAcceptes = (formData.diagnosticImprevus?.imprevus || [])
    .filter(i => i.accepte === true)
    .reduce((sum, i) => sum + (Number(i.prixSupplementaire) || 0), 0);

  const prixBase = Number(formData.prix) || 0;
  const prixTotal = prixBase + imprevusAcceptes;
  const acompte = Number(formData.acompte) || 0;
  const reste = Math.max(0, prixTotal - acompte);

  const handlePaymentTypeChange = (type) => {
    let newAcompte = formData.acompte;

    if (type === 'unpaid') newAcompte = 0;
    else if (type === 'paid') newAcompte = prixTotal;

    onChange({ ...formData, paymentType: type, acompte: newAcompte });
  };

  const handlePrixChange = (value) => {
    const prix = parseFloat(value) || 0;
    let type = 'unpaid';
    let acompte = formData.acompte;
    const newPrixTotal = prix + imprevusAcceptes;

    if (acompte >= newPrixTotal && newPrixTotal > 0) type = 'paid';
    else if (acompte > 0) type = 'partial';

    onChange({ ...formData, prix, paymentType: type });
  };

  const handleAcompteChange = (value) => {
    const newAcompte = parseFloat(value) || 0;
    let type = 'unpaid';

    if (newAcompte >= prixTotal && prixTotal > 0) type = 'paid';
    else if (newAcompte > 0) type = 'partial';

    onChange({ ...formData, acompte: newAcompte, paymentType: type });
  };

  return (
    <div className="row g-3">
      <div className="col-12 col-sm-4">
        <label className="form-label-modern">Prix de base (DT)</label>
        <input
          type="number"
          value={formData.prix}
          onChange={(e) => handlePrixChange(e.target.value)}
          min="0"
          step="0.01"
          placeholder="0.00"
          className="form-control-modern"
          style={{ width: '100%', fontSize: '15px', fontWeight: '600' }}
        />
      </div>

      <div className="col-12 col-sm-4">
        <label className="form-label-modern">Type de paiement</label>
        <select
          value={formData.paymentType}
          onChange={(e) => handlePaymentTypeChange(e.target.value)}
          className="form-control-modern"
          style={{ width: '100%' }}
        >
          {PAYMENT_TYPES.map(p => (
            <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
          ))}
        </select>
      </div>

      <div className="col-12 col-sm-4">
        <label className="form-label-modern">Acompte (DT)</label>
        <input
          type="number"
          value={formData.acompte}
          onChange={(e) => handleAcompteChange(e.target.value)}
          min="0"
          step="0.01"
          placeholder="0.00"
          disabled={formData.paymentType !== 'partial'}
          className="form-control-modern"
          style={{
            width: '100%', fontSize: '15px', fontWeight: '600',
            opacity: formData.paymentType !== 'partial' ? 0.6 : 1,
          }}
        />
      </div>

      {/* ✅ Détail du prix */}
      {imprevusAcceptes > 0 && (
        <div className="col-12">
          <div style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'var(--info-light)', border: '1px solid var(--info)30',
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', fontSize: '12.5px',
            }}>
              <span style={{ color: 'var(--gray-600)' }}>Prix de base</span>
              <strong style={{ color: 'var(--gray-800)' }}>{prixBase.toFixed(2)} DT</strong>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', fontSize: '12.5px',
            }}>
              <span style={{
                color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <FaPlusCircle size={10} />
                Imprévus acceptés
              </span>
              <strong style={{ color: 'var(--success)' }}>+ {imprevusAcceptes.toFixed(2)} DT</strong>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', fontSize: '13px',
              paddingTop: '6px', borderTop: '1px dashed var(--info)60',
            }}>
              <span style={{ fontWeight: '700', color: 'var(--info)' }}>Prix total</span>
              <strong style={{ fontSize: '15px', fontWeight: '800', color: 'var(--info)' }}>
                {prixTotal.toFixed(2)} DT
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Reste à payer */}
      <div className="col-12">
        <div style={{
          padding: '12px 16px', borderRadius: '10px',
          background: reste > 0 ? 'var(--danger-light)' : 'var(--success-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: '12px', fontWeight: '700',
            color: reste > 0 ? 'var(--danger)' : 'var(--success)',
            textTransform: 'uppercase', letterSpacing: '0.3px',
          }}>
            Reste à payer
          </span>
          <span style={{
            fontSize: '20px', fontWeight: '800',
            color: reste > 0 ? 'var(--danger)' : 'var(--success)',
          }}>
            {reste.toFixed(2)} DT
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;