import React, { useState } from 'react';
import { FaFileExcel } from 'react-icons/fa';

const ExportButton = ({ 
  onExport, 
  label = 'Exporter Excel', 
  variant = 'success',
  className = '',
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      await onExport();
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  const variantClass = {
    success: 'btn-modern-success',
    primary: 'btn-modern-primary',
    outline: 'btn-modern-outline',
  }[variant] || 'btn-modern-success';

  return (
    <button 
      className={`btn-modern ${variantClass} ${className}`}
      onClick={handleExport}
      disabled={loading || disabled}
    >
      {loading ? (
        <>
          <span 
            className="spinner-border spinner-border-sm" 
            role="status" 
            aria-hidden="true"
            style={{ width: '14px', height: '14px' }}
          ></span>
          Export...
        </>
      ) : (
        <>
          <FaFileExcel />
          {label}
        </>
      )}
    </button>
  );
};

export default ExportButton;