import React from "react";

const SkeletonLoader = ({ height = 300, width = "100%", borderRadius = "12px" }) => {
  return (
    <div
      style={{
        height,
        width,
        background: "linear-gradient(90deg, var(--gray-100) 25%, var(--gray-200) 50%, var(--gray-100) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite linear",
        borderRadius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );
};

export default SkeletonLoader;