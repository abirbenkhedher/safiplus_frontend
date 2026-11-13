import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { StatistiquesProvider } from "../../context/StatistiquesContext";
import Rapports from "../Atelier/Rapports";
import PeriodSelector from "../../components/statistiques/PeriodSelector";
import OverviewTab from "./tabs/OverviewTab";
import ReparationsTab from "./tabs/ReparationsTab";
import FamillesTab from "./tabs/FamillesTab";
import CategoriesTab from "./tabs/CategoriesTab";
import AppareilsTab from "./tabs/AppareilsTab";
import ReparateursTab from "./tabs/ReparateursTab";
import StatutsTab from "./tabs/StatutsTab"; // ✅ NOUVEAU
import BeneficeTab from "./tabs/BeneficeTab"; // ✅ NOUVEAU
import BeneficeFamillesTab from "./tabs/BeneficeFamillesTab";


const TABS = [
  { id: "overview", label: "Vue d'ensemble", icon: "📊" },
  { id: "reparations", label: "Réparations", icon: "🔧" },
  { id: "familles", label: "Familles", icon: "🗂️" },
  { id: "categories", label: "Catégories", icon: "🏷️" },
  { id: "appareils", label: "Appareils", icon: "📱" },
  { id: "reparateurs", label: "Réparateurs", icon: "👨‍🔧" },
  { id: "statuts", label: "Statuts", icon: "📊" }, // ✅ NOUVEAU
    { id: "benefice", label: "Bénéfices", icon: "💰" }, // ✅ NOUVEAU
    { id: "beneficeFamilles", label: "Bénéfice détaillé", icon: "🧮" },
  // ✅ Ancienne page « Rapports atelier » (coûts, marges, commissions)
  { id: "rapports", label: "Rapports atelier", icon: "📑", permission: "rapports" },
];

const Statistiques = () => {
  const { hasPermission } = useAuth();
  const [sp, setSp] = useSearchParams();
  // Onglets selon les permissions : statistiques et/ou rapports
  const tabs = TABS.filter((t) => hasPermission(t.permission || "statistiques"));
  const initial = tabs.some((t) => t.id === sp.get("tab")) ? sp.get("tab") : tabs[0]?.id;
  const [activeTab, setActiveTabRaw] = useState(initial);
  const setActiveTab = (id) => { setActiveTabRaw(id); setSp(id === tabs[0]?.id ? {} : { tab: id }, { replace: true }); };

  return (
    <StatistiquesProvider>
      <div
        className="fade-in-up"
        style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}
      >
        {/* En-tête */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "var(--gray-900)",
            }}
          >
            Statistiques atelier
          </h1>
          <p style={{ fontSize: "13.5px", color: "var(--gray-500)" }}>
            Analyse détaillée de l'activité de l'atelier et rapports (coûts, marges, commissions)
          </p>
        </div>

        {/* Barre de période (l'onglet Rapports a sa propre période) */}
        {activeTab !== "rapports" && (
          <div style={{ marginBottom: "20px" }}>
            <PeriodSelector />
          </div>
        )}

        {/* Navigation des Onglets */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "24px",
            borderBottom: "1px solid var(--gray-200)",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 18px",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderBottom:
                  activeTab === tab.id
                    ? "2px solid var(--primary)"
                    : "2px solid transparent",
                color:
                  activeTab === tab.id ? "var(--primary)" : "var(--gray-500)",
                fontWeight: "600",
                fontSize: "13.5px",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div>
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "reparations" && <ReparationsTab />}
          {activeTab === "familles" && <FamillesTab />}
          {activeTab === "categories" && <CategoriesTab />}
          {activeTab === "appareils" && <AppareilsTab />}
          {activeTab === "reparateurs" && <ReparateursTab />}
          {activeTab === "statuts" && <StatutsTab />} 
          {activeTab === "benefice" && <BeneficeTab />}
          {activeTab === "beneficeFamilles" && <BeneficeFamillesTab />}
          {activeTab === "rapports" && <Rapports integre />}

        </div>
      </div>
    </StatistiquesProvider>
  );
};

export default Statistiques;