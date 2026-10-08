import React from "react";
import {
  FaTools,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
  FaWallet,
  FaHandHoldingUsd,
} from "react-icons/fa";

const StatsCards = ({ stats, userRole }) => {
  if (!stats) return null;

  const statuts = stats.reparationsParStatut || [];

  // ✅ Normaliser un label
  const normalize = (label) =>
    (label || "").trim().toUpperCase().replace(/\s+/g, " ");

  // ✅ Somme des counts selon un prédicat
  const sumWhere = (predicate) =>
    statuts
      .filter((s) => predicate(normalize(s.label)))
      .reduce((sum, s) => sum + (s.count || 0), 0);

  // ✅ EN COURS → label exact "EN COURS"
  const enCours = sumWhere((label) => label === "EN COURS");

  // ✅ RÉPARÉES → contient "REPARE", PAS "NON REPARE", PAS "SAV"
  const repare = sumWhere(
    (label) =>
      label.includes("REPARE") &&
      !label.includes("NON REPARE") &&
      !label.includes("SAV") &&
      !label.includes("SORTIE")
  );

  // ✅ NON RÉPARÉES → contient "NON REPARE", PAS "SAV"
  const nonRepare = sumWhere(
    (label) =>
      label.includes("NON REPARE") &&
      !label.includes("SAV") &&
      !label.includes("SORTIE")
  );

  // ✅ 4 cartes réparations
  const mainCards = [
    {
      title: "Total réparations",
      value: stats.totalReparations || 0,
      icon: <FaTools />,
      color: "#4361ee",
      bg: "rgba(67, 97, 238, 0.1)",
      subtitle: `${stats.reparationsMois || 0} ce mois`,
    },
    {
      title: "En cours",
      value: enCours,
      icon: <FaSpinner />,
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.1)",
      subtitle: "En intervention",
    },
    {
      title: "Réparées",
      value: repare,
      icon: <FaCheckCircle />,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)",
      subtitle: "Prêtes ou livrées",
    },
    {
      title: "Non réparées",
      value: nonRepare,
      icon: <FaTimesCircle />,
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.1)",
      subtitle: "Échec / refus",
    },
  ];

  // ✅ 3 cartes financières
  const financeCards = [
    {
      title: "Chiffre d'affaires",
      value: `${(stats.ca || 0).toFixed(2)} DT`,
      icon: <FaMoneyBillWave />,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)",
      subtitle: "Total facturé",
    },
    {
      title: "Total encaissé",
      value: `${(
        stats.encaisse || (stats.ca || 0) - (stats.restant || 0)
      ).toFixed(2)} DT`,
      icon: <FaHandHoldingUsd />,
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.1)",
      subtitle: "Acomptes + paiements",
    },
    {
      title: "Reste à recevoir",
      value: `${(stats.restant || 0).toFixed(2)} DT`,
      icon: <FaWallet />,
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
      subtitle: "Impayés",
    },
  ];

  // ✅ NOUVEAU : réservé à l'ADMIN uniquement
  const showFinance = userRole === "ADMIN";

  const CardItem = ({ card }) => (
    <div
      style={{
        background: "white",
        border: "1px solid var(--gray-200)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        transition: "all 200ms ease",
        cursor: "default",
        height: "100%",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "var(--shadow-lg)";
        e.currentTarget.style.borderColor = card.color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--gray-200)";
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "14px",
          background: card.bg,
          color: card.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          flexShrink: 0,
        }}
      >
        {card.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "600",
            color: "var(--gray-500)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "4px",
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            fontSize: "26px",
            fontWeight: "800",
            color: "var(--gray-900)",
            lineHeight: 1.1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {card.value}
        </div>
        <div
          style={{
            fontSize: "11.5px",
            color: "var(--gray-500)",
            marginTop: "4px",
          }}
        >
          {card.subtitle}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ✅ 4 cartes réparations (visibles pour tous) */}
      <div className="row g-3 mb-3">
        {mainCards.map((card, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-3">
            <CardItem card={card} />
          </div>
        ))}
      </div>

      {/* ✅ 3 cartes financières — ADMIN uniquement */}
      {showFinance && (
        <div className="row g-3 mb-4">
          {financeCards.map((card, i) => (
            <div key={i} className="col-12 col-sm-6 col-lg-4">
              <CardItem card={card} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default StatsCards;