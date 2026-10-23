import React from "react";
import SkeletonLoader from "./SkeletonLoader";
import EmptyState from "./EmptyState";

const ChartCard = ({ title, loading, error, empty, children, height = 300 }) => {
  return (
    <div
      className="card-modern"
      style={{
        padding: "20px",
        height: height + 70,
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s ease",
      }}
    >
      <h3
        style={{
          fontSize: "15px",
          fontWeight: "700",
          marginBottom: "16px",
          color: "var(--gray-800)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {title}
      </h3>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {loading ? (
          <SkeletonLoader height={height} />
        ) : error ? (
          <div style={{ color: "var(--danger)", fontSize: "14px", padding: "20px", textAlign: "center" }}>
            ⚠️ {error}
          </div>
        ) : empty ? (
          <EmptyState />
        ) : (
          <div style={{ height: "100%", width: "100%" }}>{children}</div>
        )}
      </div>
    </div>
  );
};

export default ChartCard;