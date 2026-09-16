import React from 'react';
import IMEIScanner from '../common/IMEIScanner';

/**
 * ✅ Wrapper pour le scanner IMEI dans le contexte Réparation
 */
const IMEIScannerModal = ({ show, onClose, onScan }) => {
  if (!show) return null;

  return (
    <IMEIScanner
      onScan={onScan}
      onClose={onClose}
      title="Scanner l'IMEI"
      subtitle="Pointez la caméra vers le code-barres"
    />
  );
};

export default IMEIScannerModal;