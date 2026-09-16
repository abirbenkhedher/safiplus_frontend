import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDashboardStats, getDashboardCharts } from "../../api/dashboard";
import StatsCards from "./StatsCards";
import Charts from "./Charts";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [chartsData, setChartsData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const [statsRes, chartsRes] = await Promise.all([
        getDashboardStats(),
        getDashboardCharts(),
      ]);
      setStats(statsRes.data);
      setChartsData(chartsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          gap: "16px",
        }}
      >
        <div className="spinner-modern" />
        <p style={{ color: "var(--gray-500)", fontSize: "13.5px" }}>
          Chargement du tableau de bord...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="card-modern"
        style={{
          background: "var(--danger-light)",
          border: "1px solid var(--danger)",
        }}
      >
        <p style={{ margin: 0, color: "var(--danger)", fontWeight: "500" }}>
          ⚠️ {error}
        </p>
        <button
          className="btn-modern btn-modern-danger"
          style={{ marginTop: "12px" }}
          onClick={loadDashboardData}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        className="card-modern"
        style={{ textAlign: "center", padding: "60px" }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
        <p style={{ color: "var(--gray-500)", margin: 0 }}>
          Aucune donnée disponible
        </p>
      </div>
    );
  }

  const roleEmoji =
    {
      ADMIN: "👑",
      COMMERCIAL: "💼",
      REPARATEUR: "🔧",
    }[user?.role] || "";

  const roleLabel =
    {
      ADMIN: "Administrateur",
      COMMERCIAL: "Commercial",
      REPARATEUR: "Réparateur",
    }[user?.role] || "";

  return (
    <div className="fade-in-up">
      {/* ========================================== */}
      {/* EN-TÊTE */}
      {/* ========================================== */}
      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "var(--gray-900)",
              marginBottom: "4px",
            }}
          >
            Tableau de bord
          </h1>
          <p
            style={{
              fontSize: "13.5px",
              color: "var(--gray-500)",
              margin: 0,
            }}
          >
            Bienvenue{" "}
            <strong style={{ color: "var(--gray-700)" }}>
              {user?.firstName} {user?.lastName}
            </strong>{" "}
            {roleEmoji} • {roleLabel}
          </p>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "white",
            border: "1px solid var(--gray-200)",
            borderRadius: "10px",
            fontSize: "12.5px",
            fontWeight: "600",
            color: "var(--gray-600)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          📅{" "}
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* 4 CARTES ESSENTIELLES */}
      {/* ========================================== */}
      <StatsCards stats={stats} userRole={user?.role} />

      {/* ========================================== */}
      {/* 3 GRAPHIQUES CLÉS */}
      {/* ========================================== */}
      {chartsData && <Charts stats={stats} chartsData={chartsData} />}
    </div>
  );
};

export default Dashboard;