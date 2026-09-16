import React from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';
import { PAYMENT_TYPES } from '../../constants/reparations';

/**
 * ✅ Section paiement intelligente
 * - Calcul auto du type
 * - Reste calculé en temps réel
 */
const PaymentSection = ({ formData, onChange }) => {
  const reste = Math.max(0, (formData.prix || 0) - (formData.acompte || 0));

  const handlePaymentTypeChange = (type) => {
    let newAcompte = formData.acompte;
    
    if (type === 'unpaid') newAcompte = 0;
    else if (type === 'paid') newAcompte = formData.prix;

    onChange({ ...formData, paymentType: type, acompte: newAcompte });
  };

  const handlePrixChange = (value) => {
    const prix = parseFloat(value) || 0;
    let type = 'unpaid';
    let acompte = formData.acompte;

    if (acompte >= prix && prix > 0) type = 'paid';
    else if (acompte > 0) type = 'partial';

    onChange({ ...formData, prix, paymentType: type });
  };

  const handleAcompteChange = (value) => {
    const acompte = parseFloat(value) || 0;
    const prix = formData.prix || 0;
    let type = 'unpaid';

    if (acompte >= prix && prix > 0) type = 'paid';
    else if (acompte > 0) type = 'partial';

    onChange({ ...formData, acompte, paymentType: type });
  };

  return (
    <div className="row g-3">
      <div className="col-12 col-sm-4">
        <label className="form-label-modern">Prix (DT)</label>
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