import React, { useCallback, useMemo } from 'react';
import { FaMoneyBillWave, FaPlusCircle } from 'react-icons/fa';

// ============================================================
// ✅ Calcul auto du type de paiement (basé sur PRIX TOTAL)
// ============================================================
const computePaymentType = (prixTotal, acompte) => {
  const p = Number(prixTotal) || 0;
  const a = Number(acompte) || 0;

  if (a <= 0) return 'unpaid';
  if (p > 0 && a >= p) return 'paid';
  return 'partial';
};

const PaymentSection = ({ formData, onChange }) => {
  // ✅ Imprévus acceptés (prix supplémentaires)
  const imprevusAcceptes = (formData.diagnosticImprevus?.imprevus || [])
    .filter((i) => i.accepte === true)
    .reduce((sum, i) => sum + (Number(i.prixSupplementaire) || 0), 0);

  const prixBase = Number(formData.prix) || 0;
  const prixTotal = prixBase + imprevusAcceptes; // ✅ PRIX TOTAL
  const acompte = Number(formData.acompte) || 0;
  const reste = Math.max(0, prixTotal - acompte);

  // ------------------------------------------------------------
  // ✅ Changement de PRIX
  // ------------------------------------------------------------
  const handlePrixChange = useCallback(
    (value) => {
      const newPrix = parseFloat(value) || 0;
      const newPrixTotal = newPrix + imprevusAcceptes;

      onChange((prev) => {
        const currentAcompte = Number(prev.acompte) || 0;
        return {
          ...prev,
          prix: newPrix,
          paymentType: computePaymentType(newPrixTotal, currentAcompte),
        };
      });
    },
    [onChange, imprevusAcceptes]
  );

  // ------------------------------------------------------------
  // ✅ Changement d'ACOMPTE — basé sur PRIX TOTAL (imprévus inclus)
  // ------------------------------------------------------------
  const handleAcompteChange = useCallback(
    (value) => {
      const rawValue = parseFloat(value) || 0;
      // ✅ On ne limite PAS à prixBase : on accepte jusqu'à prixTotal
      const newAcompte = Math.max(0, rawValue);

      onChange((prev) => {
        const currentPrixTotal =
          (Number(prev.prix) || 0) + imprevusAcceptes;
        return {
          ...prev,
          acompte: newAcompte,
          // ✅ Type calculé sur PRIX TOTAL
          paymentType: computePaymentType(currentPrixTotal, newAcompte),
        };
      });
    },
    [onChange, imprevusAcceptes]
  );

  return (
    <div className="row g-3">
      {/* PRIX DE BASE */}
      <div className="col-12 col-sm-6">
        <label className="form-label-modern">
          <FaMoneyBillWave size={10} style={{ marginRight: 4, color: 'var(--gray-400)' }} />
          Prix de base (DT)
        </label>
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

      {/* ACOMPTE — max = PRIX TOTAL (imprévus inclus) */}
      <div className="col-12 col-sm-6">
        <label className="form-label-modern">
          Acompte versé (DT)
          {imprevusAcceptes > 0 && (
            <span style={{
              marginLeft: 6,
              fontSize: '10px',
              color: 'var(--info)',
              fontWeight: 600,
            }}>
              (max : {prixTotal.toFixed(2)})
            </span>
          )}
        </label>
        <input
          type="number"
          value={formData.acompte}
          onChange={(e) => handleAcompteChange(e.target.value)}
          min="0"
          // ✅ MAX = PRIX TOTAL (inclut les imprévus acceptés)
          max={prixTotal > 0 ? prixTotal : undefined}
          step="0.01"
          placeholder="0.00"
          className="form-control-modern"
          style={{
            width: '100%',
            fontSize: '15px',
            fontWeight: '600',
            borderColor:
              acompte > 0
                ? prixTotal > 0 && acompte >= prixTotal
                  ? 'var(--success)'
                  : 'var(--warning)'
                : undefined,
            transition: 'border-color 150ms ease',
          }}
        />
        {/* ✅ Message d'aide si l'acompte dépasse le prix total */}
        {acompte > prixTotal && prixTotal > 0 && (
          <div style={{
            fontSize: '10.5px',
            color: 'var(--warning)',
            marginTop: '4px',
            fontWeight: 600,
          }}>
            ⚠️ L'acompte dépasse le prix total ({prixTotal.toFixed(2)} DT)
          </div>
        )}
      </div>

      {/* DÉTAIL DU PRIX (imprévus) */}
      {imprevusAcceptes > 0 && (
        <div className="col-12">
          <div style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'var(--info-light)', border: '1px solid var(--info)30',
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <span style={{ color: 'var(--gray-600)' }}>Prix de base</span>
              <strong style={{ color: 'var(--gray-800)' }}>{prixBase.toFixed(2)} DT</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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

      {/* RESTE À PAYER */}
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
            {reste === 0 && acompte > 0 ? '✅ Entièrement payé' : 'Reste à payer'}
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