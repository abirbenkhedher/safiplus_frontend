import { useStatistiques } from "../../../hooks/useStatistiques";
import KpiGrid from "../../../components/statistiques/KpiGrid";
import ChartCard from "../../../components/statistiques/ChartCard";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from "recharts";
import {
  FaMoneyBillWave, FaTools, FaTruck, FaCoins, FaChartLine, FaPercent,
  FaFileInvoice, FaCogs, FaUserTie,
} from "react-icons/fa";

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n || 0);

const COLORS = ["#4361ee", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];
const DEP_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16"];

const BeneficeTab = () => {
  const { data, loading, error } = useStatistiques("benefice");

  const kpis = [
    {
      icon: <FaMoneyBillWave />, label: "CA HT",
      value: `${fmt(data?.ca_total)} DT`,
      variation: data?.variations?.ca_total,
      subtitle: `TTC : ${fmt(data?.ca_ttc)} DT · TVA : ${fmt(data?.tva_collectee)} DT`,
      color: "#4361ee", bg: "rgba(67,97,238,0.1)",
    },
    {
      // ✅ Pièces achetées pour le stock : comptées à leur coût d'achat quand elles
      //    sont consommées dans un dossier de réparation (pas à l'achat)
      icon: <FaCogs />, label: "Coût des pièces",
      value: `${fmt(data?.cout_pieces)} DT`,
      subtitle: `achats stock de la période : ${fmt(data?.achats_stock_periode)} DT`,
      color: "#f97316", bg: "rgba(249,115,22,0.1)",
    },
    {
      icon: <FaUserTie />, label: "Commissions",
      value: `${fmt(data?.commissions)} DT`,
      subtitle: "réparateurs",
      color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",
    },
    {
      icon: <FaTools />, label: "Dép. Réparation",
      value: `${fmt(data?.depenses_reparation)} DT`,
      subtitle: `${data?.nb_dep_reparation || 0} facture(s)`,
      color: "#f59e0b", bg: "rgba(245,158,11,0.1)",
    },
    {
      icon: <FaTruck />, label: "Dép. Diverse",
      value: `${fmt(data?.depenses_diverse)} DT`,
      subtitle: `${data?.nb_dep_diverse || 0} dépense(s)`,
      color: "#ef4444", bg: "rgba(239,68,68,0.1)",
    },
    {
      icon: <FaFileInvoice />, label: "Achats hors stock",
      value: `${fmt(data?.achats_hors_stock)} DT`,
      subtitle: "lignes libres des factures d'achat",
      color: "#e11d48", bg: "rgba(225,29,72,0.1)",
    },
    {
      icon: <FaCoins />, label: "Bénéfice Net",
      value: `${fmt(data?.benefice_net)} DT`,
      variation: data?.variations?.benefice_net,
      color: (data?.benefice_net || 0) >= 0 ? "#10b981" : "#ef4444",
      bg: (data?.benefice_net || 0) >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
    },
    {
      icon: <FaChartLine />, label: "Marge Brute",
      value: `${fmt(data?.marge_brute)} DT`,
      color: "#06b6d4", bg: "rgba(6,182,212,0.1)",
    },
    {
      icon: <FaPercent />, label: "Taux Marge Nette",
      value: `${data?.taux_marge_nette || 0} %`,
      color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",
    },
  ];

  const pieData = data
    ? [
        { name: "Pièces", value: data.cout_pieces },
        { name: "Commissions", value: data.commissions },
        { name: "Dép. Réparation", value: data.depenses_reparation },
        { name: "Dép. Diverse", value: data.depenses_diverse + (data.achats_hors_stock || 0) },
        { name: "Bénéfice Net", value: Math.max(data.benefice_net, 0) },
      ]
    : [];

  return (
    <div>
      <KpiGrid cols={3}>
        {kpis.map((k, i) => (
          <KpiCard key={i} {...k} loading={loading} />
        ))}
      </KpiGrid>

      {/* Évolution */}
      <div style={{ marginBottom: "24px" }}>
        <ChartCard
          title="📈 Évolution CA / Dépenses / Bénéfice"
          loading={loading} error={error}
          empty={!data?.evolution?.length}
          height={320}
        >
          <ResponsiveContainer>
            <AreaChart data={data?.evolution || []}>
              <defs>
                <linearGradient id="gCA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v) => `${v} DT`} />
              <Tooltip formatter={(v) => `${fmt(v)} DT`} />
              <Legend />
              <Area type="monotone" dataKey="ca" name="CA" stroke="#4361ee"
                fill="url(#gCA)" strokeWidth={2} />
              <Area type="monotone" dataKey="depenses" name="Dépenses" stroke="#ef4444"
                fill="url(#gDep)" strokeWidth={2} />
              <Area type="monotone" dataKey="benefice" name="Bénéfice" stroke="#10b981"
                fill="url(#gBen)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Répartition + Top 5 Dépenses */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: "20px", marginBottom: "24px" }}>
        <ChartCard
          title="🧩 Répartition CA / Dépenses / Bénéfice"
          loading={loading} error={error}
          empty={!pieData.length || data?.ca_total === 0}
          height={300}
        >
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={90} innerRadius={50} paddingAngle={2}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${fmt(v)} DT`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ✅ Top 5 Dépenses — Dép diverse affiche sa CATÉGORIE */}
        <ChartCard
          title="💸 Top 5 Dépenses (les plus grosses)"
          loading={loading} error={error}
          empty={!data?.top_depenses?.length}
          height={300}
        >
          {data?.top_depenses?.length ? (
            <div style={{
              display: "flex", flexDirection: "column",
              gap: "8px", height: "100%", overflowY: "auto",
              paddingRight: "4px",
            }}>
              {data.top_depenses.map((d, i) => {
                const isRepa = d.type === "REPARATION";
                // ✅ Libellé principal :
                //   - Réparation → fournisseur (sinon n° facture, sinon numéro)
                //   - Diverse     → catégorie (sinon motif, sinon numéro)
                const mainLabel = isRepa
                  ? (d.fournisseur !== "—" && d.fournisseur) ||
                    d.factureNumero ||
                    d.numero || "—"
                  : (d.categorieDiverse !== "—" && d.categorieDiverse) ||
                    d.motifDiverse ||
                    d.numero || "—";

                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 12px", background: "var(--gray-50)",
                    borderRadius: "10px",
                    border: "1px solid var(--gray-200)",
                  }}>
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "7px",
                      background: DEP_COLORS[i] || "#ef4444",
                      color: "white", fontWeight: "700",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "11px",
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* ✅ Ligne principale : fournisseur OU catégorie */}
                      <div style={{
                        fontWeight: "600", fontSize: "12.5px",
                        color: "var(--gray-800)",
                        overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {mainLabel}
                      </div>

                      {/* Ligne secondaire : type + date + facture + motif/catégorie */}
                      <div style={{
                        fontSize: "10.5px", color: "var(--gray-500)",
                        display: "flex", gap: "6px", flexWrap: "wrap",
                        marginTop: "2px", alignItems: "center",
                      }}>
                        <span style={{
                          padding: "1px 5px", borderRadius: "4px",
                          background: isRepa
                            ? "rgba(67,97,238,0.12)"
                            : "rgba(245,158,11,0.15)",
                          color: isRepa ? "#4361ee" : "#f59e0b",
                          fontWeight: "600",
                        }}>
                          {isRepa ? "Répa" : "Diverse"}
                        </span>
                        <span style={{ fontWeight: "600", color: "var(--gray-600)" }}>
                          {d.famille || "Générale"}
                        </span>
                        <span>
                          {new Date(d.dateDepense).toLocaleDateString("fr-FR")}
                        </span>
                        {d.factureNumero && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                            <FaFileInvoice size={8} /> {d.factureNumero}
                          </span>
                        )}
                        {/* ✅ Pour les dépenses diverses, on affiche la catégorie en sous-titre si elle n'est pas déjà le titre principal */}
                        {!isRepa && d.categorieDiverse !== "—" && d.motifDiverse && (
                          <span style={{
                            fontStyle: "italic",
                            color: "var(--gray-500)",
                            overflow: "hidden", textOverflow: "ellipsis",
                            whiteSpace: "nowrap", maxWidth: "100%",
                          }}>
                            · {d.motifDiverse}
                          </span>
                        )}
                        {/* ✅ Pour les dépenses de réparation, afficher la catégorie diverse (si remplie) est inutile, mais on peut garder le motif */}
                        {isRepa && d.motifDiverse && (
                          <span style={{
                            fontStyle: "italic",
                            color: "var(--gray-500)",
                            overflow: "hidden", textOverflow: "ellipsis",
                            whiteSpace: "nowrap", maxWidth: "100%",
                          }}>
                            · {d.motifDiverse}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      fontSize: "13px", fontWeight: "800",
                      color: "#ef4444", flexShrink: 0,
                    }}>
                      {fmt(d.montant)} DT
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </ChartCard>
      </div>

      {/* ✅ Dépenses par famille (réparation + diverses + achats hors stock) */}
      <div className="card-modern" style={{ padding: "20px", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "4px" }}>
          🗂️ Dépenses par famille
        </h3>
        <p style={{ fontSize: "12px", color: "var(--gray-500)", margin: "0 0 12px" }}>
          « Générale » = dépense sans famille, répartie au prorata du CA dans « Bénéfice détaillé ».
        </p>
        {!data?.depenses_par_famille?.length ? (
          <div style={{ textAlign: "center", padding: "16px", color: "var(--gray-500)", fontSize: "13px" }}>
            Aucune dépense sur la période
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ fontSize: "13px", marginBottom: 0, minWidth: "520px" }}>
              <thead>
                <tr>
                  <th>Famille</th>
                  <th style={{ textAlign: "right" }}>Réparation</th>
                  <th style={{ textAlign: "right" }}>Diverses</th>
                  <th style={{ textAlign: "right" }}>Achats hors stock</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.depenses_par_famille.map((f) => (
                  <tr key={f.famille}>
                    <td style={{ fontWeight: 600, wordBreak: "break-word" }}>
                      <span className={`badge-modern ${f.generale ? "badge-modern-gray" : "badge-modern-primary"}`}>{f.famille}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>{fmt(f.reparation)} DT</td>
                    <td style={{ textAlign: "right" }}>{fmt(f.diverse)} DT</td>
                    <td style={{ textAlign: "right" }}>{fmt(f.achats_hors_stock)} DT</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(f.total)} DT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top réparations rentables */}
      <div className="card-modern" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>
          🏆 Top 5 Réparations les Plus Rentables
        </h3>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--gray-500)" }}>
            Chargement...
          </div>
        ) : !data?.top_rentables?.length ? (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--gray-500)" }}>
            Aucune donnée
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.top_rentables.map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 14px", background: "var(--gray-50)",
                borderRadius: "10px", border: "1px solid var(--gray-200)",
              }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "8px",
                  background: COLORS[i], color: "white", fontWeight: "700",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "600", fontSize: "13px",
                    color: "var(--gray-800)", fontFamily: "monospace" }}>
                    {r.numero || "—"}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--gray-500)" }}>
                    {r.marque} · {r.categorie}
                  </div>
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#10b981" }}>
                  {fmt(r.prix)} DT
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// ✅ KPI Card — Badge variation EN HAUT À DROITE (▲ 100%)
// ============================================================
const KpiCard = ({ icon, label, value, subtitle, variation, color, bg, loading }) => {
  const isPositive = variation >= 0;

  return (
    <div style={{
      position: "relative",
      background: "var(--white, #fff)",
      border: "1px solid var(--gray-200)",
      borderRadius: "16px", padding: "18px",
      display: "flex", alignItems: "center",
      gap: "14px", height: "100%",
    }}>
      {variation !== undefined && !loading && (
        <div style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "3px 8px",
          borderRadius: "8px",
          fontSize: "10.5px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "3px",
          background: isPositive
            ? "rgba(16,185,129,0.12)"
            : "rgba(239,68,68,0.12)",
          color: isPositive ? "#10b981" : "#ef4444",
          lineHeight: 1,
        }}>
          {isPositive ? "▲" : "▼"} {Math.abs(variation)}%
        </div>
      )}

      <div style={{
        width: "46px", height: "46px", borderRadius: "12px",
        background: bg, color,
        display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "20px", flexShrink: 0,
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingRight: "60px" }}>
        <div style={{
          fontSize: "11px", fontWeight: "600", color: "var(--gray-500)",
          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px",
        }}>
          {label}
        </div>
        <div style={{
          fontSize: "18px", fontWeight: "800", color: "var(--gray-900)",
          lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {loading ? "—" : value}
        </div>
        {subtitle && (
          <div style={{ fontSize: "11.5px", marginTop: "3px", color: "var(--gray-500)" }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default BeneficeTab;