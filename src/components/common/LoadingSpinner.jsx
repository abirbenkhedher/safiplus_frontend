import React from 'react';

const LoadingSpinner = ({ fullScreen = true, text = 'Chargement...' }) => {
  if (fullScreen) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: '16px',
        }}
      >
        <div className="spinner-modern"></div>
        <p style={{ color: 'var(--gray-500)', fontSize: '13.5px' }}>{text}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        gap: '12px',
      }}
    >
      <div className="spinner-modern"></div>
      <p style={{ color: 'var(--gray-500)', fontSize: '13px', margin: 0 }}>{text}</p>
    </div>
  );
};

export default LoadingSpinner;