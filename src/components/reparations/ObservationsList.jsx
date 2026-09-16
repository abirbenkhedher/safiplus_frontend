import React, { useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

/**
 * ✅ Liste d'observations
 * - 1 champ par défaut
 * - Possibilité d'ajouter d'autres
 */
const ObservationsList = ({ observations = [], onChange }) => {
  // ✅ Initialiser avec 1 champ si vide
  useEffect(() => {
    if (observations.length === 0) {
      onChange([{ text: '', date: new Date().toISOString() }]);
    }
  }, []);

  const addObservation = () => {
    onChange([...observations, { text: '', date: new Date().toISOString() }]);
  };

  const updateObservation = (index, text) => {
    const updated = [...observations];
    updated[index] = { ...updated[index], text };
    onChange(updated);
  };

  const removeObservation = (index) => {
    // ✅ Ne pas supprimer le dernier champ
    if (observations.length === 1) {
      onChange([{ text: '', date: new Date().toISOString() }]);
      return;
    }
    onChange(observations.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '10px',
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)' }}>
          {observations.length} observation(s)
        </div>
        <button
          type="button"
          onClick={addObservation}
          className="btn-modern btn-modern-outline"
          style={{ fontSize: '11.5px', padding: '6px 12px' }}
        >
          <FaPlus size={10} /> Ajouter
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {observations.map((obs, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{
              minWidth: '26px', height: '26px', borderRadius: '6px',
              background: 'var(--primary-light)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10.5px', fontWeight: '700', flexShrink: 0, marginTop: '8px',
            }}>
              #{index + 1}
            </div>
            <textarea
              value={obs.text}
              onChange={(e) => updateObservation(index, e.target.value)}
              rows={1}
              placeholder={index === 0 ? "Observation principale..." : "Observation supplémentaire..."}
              className="form-control-modern"
              style={{
                flex: 1, minHeight: '42px', height: 'auto',
                padding: '10px 14px', resize: 'vertical', fontFamily: 'inherit',
              }}
            />
            {/* ✅ Ne pas afficher le bouton supprimer si c'est le seul */}
            {observations.length > 1 && (
              <button
                type="button"
                onClick={() => removeObservation(index)}
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ObservationsList;