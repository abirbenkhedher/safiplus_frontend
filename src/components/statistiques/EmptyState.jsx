import React from "react";

const EmptyState = ({ message = "Aucune donnée disponible pour cette période." }) => {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.6 }}>📊</div>
      <p style={{ color: "var(--gray-500)", fontSize: "14px", margin: 0, maxWidth: "300px", lineHeight: 1.5 }}>
        {message}
      </p>
    </div>
  );
};

export default EmptyState;