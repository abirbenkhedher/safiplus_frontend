import React from "react";
import {
  FaTools,
  FaSpinner,
  FaCheckCircle,
  FaMoneyBillWave,
  FaWallet,
} from "react-icons/fa";

const StatsCards = ({ stats, userRole }) => {
  if (!stats) return null;

  // ✅ Fonction pour compter les statuts correspondants
  const countStatus = (keywords) => {
    if (!stats.reparationsParStatut) return 0;
    return stats.reparationsParStatut
      .filter((s) =>
        keywords.some((k) =>
          s.label?.toLowerCase().includes(k.toLowerCase())
        )
      )
      .reduce((sum, s) => sum + s.count, 0);
  };

  // ✅ 4 cartes principales
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
      value: countStatus(["EN COURS", "SAV"]) - countStatus(["SAV REPARE", "SAV NON", "SAV SORTIE"]),
      icon: <FaSpinner />,
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.1)",
      subtitle: "En intervention",
    },
    {
      title: "Réparées / Sorties réparées",
      value: countStatus(["REPARE", "SORTIE REPARE", "SAV REPARE", "SAV SORTIE REPARE"]),
      icon: <FaCheckCircle />,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)",
      subtitle: "Prêtes ou livrées",
    },
  ];

  // ✅ 2 cartes financières (masquées pour réparateur)
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
      title: "Reste à recevoir",
      value: `${(stats.restant || 0).toFixed(2)} DT`,
      icon: <FaWallet />,
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
      subtitle: "Impayés",
    },
  ];

  const showFinance = userRole !== "REPARATEUR";

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
      {/* 4 cartes principales */}
      <div className="row g-3 mb-3">
        {mainCards.map((card, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-4">
            <CardItem card={card} />
          </div>
        ))}
      </div>

      {/* 2 cartes financières */}
      {showFinance && (
        <div className="row g-3 mb-4">
          {financeCards.map((card, i) => (
            <div key={i} className="col-12 col-sm-6">
              <CardItem card={card} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default StatsCards;