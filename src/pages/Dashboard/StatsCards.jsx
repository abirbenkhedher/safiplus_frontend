import {
  FaTools,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
  FaWallet,
  FaHandHoldingUsd,
} from "react-icons/fa";
import StatCard from "../../components/common/StatCard";

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
      color: "var(--primary)",
      bg: "rgba(var(--primary-rgb), 0.1)",
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
    <StatCard icon={card.icon} label={card.title} value={card.value} hint={card.subtitle} color={card.color} bg={card.bg} />
  );

  return (
    <>
      {/* ✅ 4 cartes réparations (visibles pour tous) */}
      <div className="row g-3 mb-3">
        {mainCards.map((card, i) => (
          <div key={i} className="col-6 col-lg-3">
            <CardItem card={card} />
          </div>
        ))}
      </div>

      {/* ✅ 3 cartes financières — ADMIN uniquement */}
      {showFinance && (
        <div className="row g-3 mb-4">
          {financeCards.map((card, i) => (
            <div key={i} className="col-6 col-lg-4">
              <CardItem card={card} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default StatsCards;