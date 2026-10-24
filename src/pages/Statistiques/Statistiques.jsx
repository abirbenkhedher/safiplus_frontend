import React, { useState } from "react";
import { StatistiquesProvider } from "../../context/StatistiquesContext";
import PeriodSelector from "../../components/statistiques/PeriodSelector";
import OverviewTab from "./tabs/OverviewTab";
import ReparationsTab from "./tabs/ReparationsTab";
import FamillesTab from "./tabs/FamillesTab";
import CategoriesTab from "./tabs/CategoriesTab";
import AppareilsTab from "./tabs/AppareilsTab";
import ReparateursTab from "./tabs/ReparateursTab";

const TABS = [
  { id: "overview",    label: "Vue d'ensemble", icon: "📊" },
  { id: "reparations", label: "Réparations",    icon: "🔧" },
  { id: "familles",    label: "Familles",       icon: "🗂️" },
  { id: "categories",  label: "Catégories",     icon: "🏷️" },
  { id: "appareils",   label: "Appareils",      icon: "📱" }, 
    { id: "reparateurs", label: "Réparateurs",    icon: "👨‍🔧" },  // ✅ AJOUT

];

const Statistiques = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <StatistiquesProvider>
      <div className="fade-in-up" style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
        {/* En-tête */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "var(--gray-900)" }}>
            Statistiques
          </h1>
          <p style={{ fontSize: "13.5px", color: "var(--gray-500)" }}>
            Analyse détaillée de l'activité de l'atelier
          </p>
        </div>

        {/* Barre de période - Prend toute la largeur */}
        <div style={{ marginBottom: "20px" }}>
          <PeriodSelector />
        </div>

        {/* Navigation des Onglets */}
        <div style={{ 
          display: "flex", gap: "4px", marginBottom: "24px", 
          borderBottom: "1px solid var(--gray-200)", overflowX: "auto",
          WebkitOverflowScrolling: "touch" // Pour un scroll fluide sur iOS
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 18px", background: "none", border: "none", cursor: "pointer",
                borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--primary)" : "var(--gray-500)",
                fontWeight: "600", fontSize: "13.5px", whiteSpace: "nowrap",
                transition: "all 0.2s ease"
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


        </div>
      </div>
    </StatistiquesProvider>
  );
};

export default Statistiques;