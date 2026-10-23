import React from "react";

const KpiGrid = ({ children, cols = 4 }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${cols > 2 ? "240px" : "280px"}, 1fr))`,
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {children}
    </div>
  );
};

export default KpiGrid;