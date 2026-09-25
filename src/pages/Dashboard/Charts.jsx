import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#4361ee",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6b7280",
  "#84cc16",
  "#eab308",
];

const Charts = ({ stats, chartsData }) => {
  const [activeTab, setActiveTab] = useState("day");

  if (!stats || !chartsData) return null;

  // ============================================================
  // ✅ 1. STATUTS
  // ============================================================
  const statusData = (stats.reparationsParStatut || []).map((item) => ({
    label: item.label || "N/A",
    count: item.count,
    color: item.color,
  }));

  // ============================================================
  // ✅ 2. ÉTAT DE PAIEMENT
  // ============================================================
  const paymentData = [
    {
      label: "Payé",
      count: stats.paymentsStats?.paid || 0,
      color: "#10b981",
    },
    {
      label: "Acompte partiel",
      count: stats.paymentsStats?.partial || 0,
      color: "#f59e0b",
    },
    {
      label: "Non payé",
      count: stats.paymentsStats?.unpaid || 0,
      color: "#ef4444",
    },
  ].filter(item => item.count > 0);

  // ============================================================
  // ✅ 3. ÉVOLUTION DES RÉPARATIONS
  // ============================================================
  const jourData = (chartsData.reparationsParJour || []).map((item) => ({
    date: new Date(item.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    }),
    count: item.count,
  }));

  const monthNames = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];
  const moisData = (chartsData.caParMois || []).map((item) => {
    const date = new Date(item.month);
    return {
      month: monthNames[date.getMonth()],
      total: item.total || 0,
    };
  });

  // ============================================================
  // ✅ 4. TOP OBJETS
  // ============================================================
  const topObjetsData = stats.topObjets || [];

  // ============================================================
  // ✅ 5. ACTIVITÉ DES RÉPARATEURS
  // ============================================================
  const activiteData = stats.activiteReparateurs || [];

  // ============================================================
  // ✅ 6. TOP ZONES (Réparations par zone)
  // ============================================================
  const topZonesData = (stats.topZones || []).sort(
    (a, b) => b.count - a.count
  );

  // ✅ Styles
  const cardStyle = {
    background: "var(--gray-50)",
    border: "1px solid var(--gray-200)",
    borderRadius: "16px",
    padding: "20px",
    height: "100%",
    boxShadow: "var(--shadow-sm)",
  };

  const titleStyle = {
    fontSize: "14px",
    fontWeight: "700",
    color: "var(--gray-800)",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const emptyStyle = {
    height: "260px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--gray-400)",
    fontSize: "13px",
    gap: "8px",
  };

  return (
    <div className="row g-3">
      {/* ========================================== */}
      {/* 1. ÉVOLUTION DES RÉPARATIONS */}
      {/* ========================================== */}
      <div className="col-12">
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h6 style={{ ...titleStyle, marginBottom: 0 }}>
              📈 Évolution des réparations
            </h6>

            <div
              style={{
                display: "flex",
                gap: "4px",
                background: "var(--gray-100)",
                padding: "4px",
                borderRadius: "10px",
              }}
            >
              {[
                { id: "day", label: "30 jours" },
                { id: "month", label: "Par mois" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background:
                      activeTab === tab.id ? "white" : "transparent",
                    color:
                      activeTab === tab.id
                        ? "var(--primary)"
                        : "var(--gray-500)",
                    boxShadow:
                      activeTab === tab.id
                        ? "0 2px 4px rgba(0,0,0,0.05)"
                        : "none",
                    transition: "all 150ms ease",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            {activeTab === "day" ? (
              <AreaChart data={jourData}>
                <defs>
                  <linearGradient
                    id="colorCount"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#4361ee"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="#4361ee"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#4361ee"
                  fill="url(#colorCount)"
                  strokeWidth={2}
                  name="Réparations"
                />
              </AreaChart>
            ) : (
              <BarChart data={moisData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => `${v.toFixed(2)} DT`}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="total"
                  fill="#4361ee"
                  name="CA (DT)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. RÉPARTITION PAR STATUT */}
      {/* ========================================== */}
      <div className="col-12">
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h6 style={{ ...titleStyle, marginBottom: 0 }}>
              📊 Répartition par statut
            </h6>
            <span
              className="badge-modern badge-modern-gray"
              style={{ fontSize: "11px" }}
            >
              {statusData.reduce((sum, s) => sum + s.count, 0)} réparation(s)
            </span>
          </div>

          {statusData.length > 0 ? (
            <div className="row g-4 align-items-center">
              <div className="col-12 col-md-5">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ count, percent }) =>
                        `${count} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={95}
                      innerRadius={55}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.color || COLORS[index % COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) =>
                        `${props.payload.label}: ${value}`
                      }
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="col-12 col-md-7">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    maxHeight: "320px",
                    overflowY: "auto",
                    paddingRight: "8px",
                  }}
                >
                  {statusData.map((item, index) => {
                    const total = statusData.reduce(
                      (sum, d) => sum + d.count,
                      0
                    );
                    const percentage =
                      total > 0 ? (item.count / total) * 100 : 0;
                    const color =
                      item.color || COLORS[index % COLORS.length];

                    return (
                      <div
                        key={index}
                        style={{
                          padding: "10px 14px",
                          background: "white",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          transition: "all 150ms ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--primary-light)";
                          e.currentTarget.style.transform =
                            "translateX(4px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: color,
                            flexShrink: 0,
                            boxShadow: `0 0 0 3px ${color}25`,
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "12.5px",
                              fontWeight: "700",
                              color: "var(--gray-800)",
                              textTransform: "uppercase",
                              letterSpacing: "0.3px",
                              marginBottom: "5px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={item.label}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              height: "4px",
                              background: "var(--gray-200)",
                              borderRadius: "2px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${percentage}%`,
                                background: color,
                                borderRadius: "2px",
                                transition: "width 0.5s ease",
                              }}
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            textAlign: "right",
                            flexShrink: 0,
                            minWidth: "60px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "16px",
                              fontWeight: "800",
                              color: color,
                              lineHeight: 1,
                            }}
                          >
                            {item.count}
                          </div>
                          <div
                            style={{
                              fontSize: "10.5px",
                              color: "var(--gray-500)",
                              marginTop: "2px",
                            }}
                          >
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={emptyStyle}>
              <div style={{ fontSize: "32px", opacity: 0.3 }}>📊</div>
              <div>Aucune donnée</div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. ÉTAT DE PAIEMENT */}
      {/* ========================================== */}
      <div className="col-12">
        <div style={cardStyle}>
          <h6 style={titleStyle}>💰 État de paiement</h6>

          {paymentData.length > 0 ? (
            <div className="row g-4 align-items-center">
              <div className="col-12 col-md-5">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ count, percent }) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) =>
                        `${props.payload.label}: ${value}`
                      }
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="col-12 col-md-7">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  {paymentData.map((item, index) => {
                    const total = paymentData.reduce(
                      (sum, d) => sum + d.count,
                      0
                    );
                    const percentage =
                      total > 0 ? (item.count / total) * 100 : 0;

                    return (
                      <div
                        key={index}
                        style={{
                          background: "white",
                          padding: "14px 18px",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "40px",
                            borderRadius: "4px",
                            background: item.color,
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "700",
                              color: "var(--gray-800)",
                              marginBottom: "4px",
                            }}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              height: "6px",
                              background: "var(--gray-200)",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${percentage}%`,
                                background: item.color,
                                borderRadius: "3px",
                                transition: "width 0.5s ease",
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div
                            style={{
                              fontSize: "22px",
                              fontWeight: "800",
                              color: item.color,
                              lineHeight: 1,
                            }}
                          >
                            {item.count}
                          </div>
                          <div
                            style={{
                              fontSize: "11.5px",
                              color: "var(--gray-500)",
                              marginTop: "2px",
                            }}
                          >
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: "16px",
                    padding: "14px 18px",
                    background: "var(--primary-light)",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "var(--primary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "4px",
                      }}
                    >
                      Total encaissé
                    </div>
                    <strong
                      style={{
                        fontSize: "18px",
                        color: "var(--success)",
                      }}
                    >
                      {(stats.acomptes || 0).toFixed(2)} DT
                    </strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "var(--primary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "4px",
                      }}
                    >
                      Reste à percevoir
                    </div>
                    <strong
                      style={{
                        fontSize: "18px",
                        color: "var(--danger)",
                      }}
                    >
                      {(stats.restant || 0).toFixed(2)} DT
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={emptyStyle}>
              <div style={{ fontSize: "32px", opacity: 0.3 }}>💰</div>
              <div>Aucune donnée</div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* ✅ 4. RÉPARTITION PAR ZONE (PLEINE LARGEUR) */}
      {/* ========================================== */}
      <div className="col-12">
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h6 style={{ ...titleStyle, marginBottom: 0 }}>
              🗺️ Réparations par zone
            </h6>
            <span
              className="badge-modern badge-modern-gray"
              style={{ fontSize: "11px" }}
            >
              {topZonesData.reduce((sum, z) => sum + z.count, 0)} réparation(s)
            </span>
          </div>

          {topZonesData.length > 0 ? (
            <div className="row g-4 align-items-center">
              {/* Graphique à barres à gauche */}
              <div className="col-12 col-lg-7">
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(320, topZonesData.length * 45)}
                >
                  <BarChart
                    data={topZonesData}
                    layout="vertical"
                    margin={{ left: 10, right: 40, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="label"
                      type="category"
                      width={150}
                      tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} réparation(s)`, "Total"]}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#4361ee"
                      name="Réparations"
                      radius={[0, 6, 6, 0]}
                      barSize={26}
                    >
                      {topZonesData.map((entry, index) => (
                        <Cell
                          key={`cell-zone-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Légende détaillée à droite */}
              <div className="col-12 col-lg-5">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    maxHeight: "500px",
                    overflowY: "auto",
                    paddingRight: "8px",
                  }}
                >
                  {topZonesData.map((item, index) => {
                    const total = topZonesData.reduce(
                      (sum, z) => sum + z.count,
                      0
                    );
                    const percentage =
                      total > 0 ? (item.count / total) * 100 : 0;
                    const color = COLORS[index % COLORS.length];

                    return (
                      <div
                        key={index}
                        style={{
                          padding: "10px 14px",
                          background: "white",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          transition: "all 150ms ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--primary-light)";
                          e.currentTarget.style.transform =
                            "translateX(4px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: color,
                            flexShrink: 0,
                            boxShadow: `0 0 0 3px ${color}25`,
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "12.5px",
                              fontWeight: "700",
                              color: "var(--gray-800)",
                              marginBottom: "5px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={item.label}
                          >
                            {item.label}
                          </div>
                          <div
                            style={{
                              height: "4px",
                              background: "var(--gray-200)",
                              borderRadius: "2px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${percentage}%`,
                                background: color,
                                borderRadius: "2px",
                                transition: "width 0.5s ease",
                              }}
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            textAlign: "right",
                            flexShrink: 0,
                            minWidth: "50px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: "800",
                              color: color,
                              lineHeight: 1,
                            }}
                          >
                            {item.count}
                          </div>
                          <div
                            style={{
                              fontSize: "10.5px",
                              color: "var(--gray-500)",
                              marginTop: "2px",
                            }}
                          >
                            {percentage.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={emptyStyle}>
              <div style={{ fontSize: "32px", opacity: 0.3 }}>🗺️</div>
              <div>Aucune donnée par zone</div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--gray-400)",
                  marginTop: "4px",
                  textAlign: "center",
                }}
              >
                💡 Remplissez le champ "Zone" des clients pour voir ce graphique
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* 5. TOP OBJETS */}
      {/* ========================================== */}
      <div className="col-12 col-lg-4">
        <div style={cardStyle}>
          <h6 style={titleStyle}>🏆 Top objets réparés</h6>

          {topObjetsData.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "8px",
              }}
            >
              {topObjetsData.slice(0, 5).map((item, index) => {
                const maxCount = topObjetsData[0]?.count || 1;
                const percentage = (item.count / maxCount) * 100;

                return (
                  <div key={index}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                        fontSize: "12.5px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "600",
                          color: "var(--gray-700)",
                        }}
                      >
                        {index + 1}. {item.label || "N/A"}
                      </span>
                      <span
                        style={{
                          fontWeight: "700",
                          color: "var(--primary)",
                        }}
                      >
                        {item.count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        background: "var(--gray-100)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${
                            COLORS[index % COLORS.length]
                          }, ${COLORS[(index + 2) % COLORS.length]})`,
                          borderRadius: "3px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={emptyStyle}>
              <div style={{ fontSize: "32px", opacity: 0.3 }}>🏆</div>
              <div>Aucune donnée</div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* 6. TOP MARQUES */}
      {/* ========================================== */}
      <div className="col-12 col-lg-4">
        <div style={cardStyle}>
          <h6 style={titleStyle}>📱 Top marques</h6>

          {(stats.topMarques || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={stats.topMarques}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  name="Réparations"
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={emptyStyle}>
              <div style={{ fontSize: "32px", opacity: 0.3 }}>📱</div>
              <div>Aucune donnée</div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* 7. ACTIVITÉ DES RÉPARATEURS */}
      {/* ========================================== */}
      <div className="col-12 col-lg-4">
        <div style={cardStyle}>
          <h6 style={titleStyle}>👨‍🔧 Activité des réparateurs</h6>

          {activiteData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={activiteData}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={110}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  name="Réparations"
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={emptyStyle}>
              <div style={{ fontSize: "32px", opacity: 0.3 }}>👨‍🔧</div>
              <div>Aucune donnée</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Charts;