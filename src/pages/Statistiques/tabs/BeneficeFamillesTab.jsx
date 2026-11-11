import React, { useState } from "react";
import { useStatistiques } from "../../../hooks/useStatistiques";
import { useStatistiquesContext } from "../../../context/StatistiquesContext";
import KpiGrid from "../../../components/statistiques/KpiGrid";
import ChartCard from "../../../components/statistiques/ChartCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import {
  FaMoneyBillWave, FaCogs, FaUserTie, FaChartLine, FaReceipt, FaCoins,
  FaChevronRight, FaChevronDown, FaFileCsv, FaInfoCircle,
} from "react-icons/fa";

// ============================================================
// ✅ BÉNÉFICE DÉTAILLÉ PAR FAMILLE (et catégories)
// - Marge directe : CA − pièces consommées − commissions (données réelles)
// - Bénéfice     : CA − quote-part des dépenses réparation + diverses
//                  (réparties au prorata du CA) → total = onglet Bénéfices
// ============================================================

const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n || 0);
const tone = (n) => ((n || 0) >= 0 ? "#10b981" : "#ef4444");

const COLONNES = [
  { key: "nb_reparations", label: "Nb", money: false },
  { key: "ca", label: "CA" },
  { key: "part_ca", label: "Part CA", suffix: " %", money: false },
  { key: "encaisse", label: "Encaissé" },
  { key: "reste", label: "Reste" },
  { key: "cout_pieces", label: "Coût pièces" },
  { key: "commissions", label: "Commissions" },
  { key: "marge_directe", label: "Marge directe", signed: true },
  { key: "depenses_reparation", label: "Dép. répa (qp)" },
  { key: "depenses_diverse", label: "Dép. diverses (qp)" },
  { key: "benefice", label: "Bénéfice", signed: true, strong: true },
  { key: "taux_benefice", label: "Taux", suffix: " %", money: false, signed: true },
];

const cell = (row, c) => {
  const v = row[c.key];
  const text = c.money === false ? `${fmt(v)}${c.suffix || ""}` : fmt(v);
  return (
    <span style={{
      color: c.signed ? tone(v) : undefined,
      fontWeight: c.strong ? 800 : undefined,
    }}>
      {text}
    </span>
  );
};

const exportCSV = (data, period) => {
  const head = ["Famille", "Catégorie", ...COLONNES.map((c) => c.label)];
  const lines = [head];
  const num = (v) => String(v ?? 0).replace(".", ",");
  (data?.familles || []).forEach((f) => {
    lines.push([f.famille, "(total famille)", ...COLONNES.map((c) => num(f[c.key]))]);
    f.categories.forEach((c) => lines.push([f.famille, c.categorie, ...COLONNES.map((k) => num(c[k.key]))]));
  });
  if (data?.totaux) lines.push(["TOTAL", "", ...COLONNES.map((c) => num(data.totaux[c.key]))]);
  const csv = lines.map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `benefice-familles_${period.from}_${period.to}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
};

const BeneficeFamillesTab = () => {
  const { data, loading, error } = useStatistiques("beneficeFamilles");
  const { period } = useStatistiquesContext();
  const [ouvertes, setOuvertes] = useState({});
  const t = data?.totaux;

  const toggle = (nom) => setOuvertes((o) => ({ ...o, [nom]: !o[nom] }));

  const kpis = [
    { icon: <FaMoneyBillWave />, label: "CA total", value: t?.ca, sub: `${t?.nb_reparations || 0} réparation(s)`, color: "#4361ee" },
    { icon: <FaCogs />, label: "Coût pièces", value: t?.cout_pieces, sub: "pièces consommées", color: "#f59e0b" },
    { icon: <FaUserTie />, label: "Commissions", value: t?.commissions, sub: "réparateurs", color: "#8b5cf6" },
    { icon: <FaChartLine />, label: "Marge directe", value: t?.marge_directe, sub: `${t?.taux_marge_directe || 0} % du CA`, color: tone(t?.marge_directe) },
    { icon: <FaReceipt />, label: "Dépenses réparties", value: t?.depenses_total, sub: "réparation + diverses", color: "#ef4444" },
    { icon: <FaCoins />, label: "Bénéfice net", value: t?.benefice, sub: `${t?.taux_benefice || 0} % du CA`, color: tone(t?.benefice) },
  ];

  const chartData = (data?.familles || []).map((f) => ({
    famille: f.famille, CA: f.ca, Dépenses: f.depenses_total, Bénéfice: f.benefice,
  }));
  const sansCout = t?.pieces_sans_cout || 0;

  return (
    <div className="bf-tab">
      <KpiGrid cols={3}>
        {kpis.map((k) => (
          <div key={k.label} className="bf-kpi">
            <div className="bf-kpi-icon" style={{ color: k.color, background: `${k.color}1a` }}>{k.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div className="bf-kpi-label">{k.label}</div>
              <div className="bf-kpi-value" style={{ color: k.label.startsWith("Bénéfice") || k.label.startsWith("Marge") ? k.color : undefined }}>
                {loading ? "—" : `${fmt(k.value)} DT`}
              </div>
              <div className="bf-kpi-sub">{k.sub}</div>
            </div>
          </div>
        ))}
      </KpiGrid>

      <div className="bf-note">
        <FaInfoCircle style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Marge directe</strong> = CA − coût des pièces consommées − commissions (données réelles de chaque réparation).{" "}
          <strong>Bénéfice</strong> = CA − quote-part des dépenses réparation et diverses
          ({fmt(data?.depenses_a_repartir?.total)} DT), réparties{" "}
          {data?.cle_repartition === "nb_reparations" ? "au nombre de réparations" : "au prorata du CA"} :
          le total est égal au bénéfice net de l'onglet « Bénéfices ».
          {sansCout > 0 && (
            <> ⚠️ {sansCout} pièce(s) sans coût enregistré : coût pièces sous-estimé.</>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <ChartCard
          title="📊 CA / Dépenses / Bénéfice par famille"
          loading={loading} error={error}
          empty={!chartData.length}
          height={320}
        >
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="famille" fontSize={11} interval={0} />
              <YAxis fontSize={11} tickFormatter={(v) => fmt(v)} />
              <Tooltip formatter={(v) => `${fmt(v)} DT`} />
              <Legend />
              <ReferenceLine y={0} stroke="#9ca3af" />
              <Bar dataKey="CA" fill="#4361ee" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Bénéfice" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card-modern bf-card">
        <div className="bf-card-head">
          <h3>🗂️ Détail par famille</h3>
          <button
            type="button"
            className="btn-modern btn-modern-outline btn-sm"
            disabled={!data?.familles?.length}
            onClick={() => exportCSV(data, period)}
          >
            <FaFileCsv /> Exporter (CSV)
          </button>
        </div>

        {loading ? (
          <div className="bf-empty">Chargement...</div>
        ) : error ? (
          <div className="bf-empty" style={{ color: "var(--danger)" }}>⚠️ {error}</div>
        ) : !data?.familles?.length ? (
          <div className="bf-empty">Aucune réparation sur la période</div>
        ) : (
          <div className="bf-scroll">
            <table className="bf-table">
              <thead>
                <tr>
                  <th className="bf-sticky">Famille / catégorie</th>
                  {COLONNES.map((c) => <th key={c.key}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.familles.map((f) => {
                  const open = !!ouvertes[f.famille];
                  return (
                    <React.Fragment key={f.famille}>
                      <tr className="bf-row-fam" onClick={() => toggle(f.famille)}>
                        <td className="bf-sticky">
                          <button type="button" className="bf-toggle" aria-expanded={open}
                            aria-label={`${open ? "Masquer" : "Afficher"} les catégories de ${f.famille}`}>
                            {open ? <FaChevronDown /> : <FaChevronRight />}
                          </button>
                          <strong>{f.famille}</strong>
                          <span className="bf-count">{f.categories.length} cat.</span>
                        </td>
                        {COLONNES.map((c) => <td key={c.key}>{cell(f, c)}</td>)}
                      </tr>
                      {open && f.categories.map((c) => (
                        <tr key={`${f.famille}-${c.categorie}`} className="bf-row-cat">
                          <td className="bf-sticky">{c.categorie}</td>
                          {COLONNES.map((col) => <td key={col.key}>{cell(c, col)}</td>)}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="bf-sticky">Total</td>
                  {COLONNES.map((c) => <td key={c.key}>{cell(t, c)}</td>)}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .bf-kpi {
          background: var(--white, #fff); border: 1px solid var(--gray-200);
          border-radius: 16px; padding: 18px; display: flex; align-items: center; gap: 14px;
        }
        .bf-kpi-icon {
          width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .bf-kpi-label { font-size: 11px; font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: .5px; }
        .bf-kpi-value { font-size: 18px; font-weight: 800; color: var(--gray-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
        .bf-kpi-sub { font-size: 11.5px; color: var(--gray-500); margin-top: 2px; }
        .bf-note {
          display: flex; gap: 10px; font-size: 12.5px; line-height: 1.5; color: var(--gray-600);
          background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: 12px;
          padding: 12px 14px; margin-bottom: 24px;
        }
        .bf-card { padding: 20px; }
        .bf-card-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
        .bf-card-head h3 { font-size: 15px; font-weight: 700; margin: 0; color: var(--gray-800); }
        .bf-empty { text-align: center; padding: 24px; color: var(--gray-500); font-size: 13px; }
        .bf-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .bf-table { width: 100%; border-collapse: collapse; font-size: 12.5px; min-width: 1100px; }
        .bf-table th, .bf-table td { padding: 9px 10px; text-align: right; white-space: nowrap; border-bottom: 1px solid var(--gray-100); font-variant-numeric: tabular-nums; }
        .bf-table th { font-size: 10.5px; text-transform: uppercase; letter-spacing: .4px; color: var(--gray-500); background: var(--gray-50); font-weight: 700; }
        .bf-table .bf-sticky { text-align: left; position: sticky; left: 0; background: var(--white, #fff); z-index: 1; min-width: 190px; }
        .bf-table th.bf-sticky { background: var(--gray-50); }
        .bf-row-fam { cursor: pointer; }
        .bf-row-fam:hover td { background: var(--gray-50); }
        .bf-row-cat td { color: var(--gray-600); background: var(--gray-50); }
        .bf-row-cat .bf-sticky { padding-left: 40px; background: var(--gray-50); }
        .bf-toggle { border: none; background: transparent; color: var(--gray-500); padding: 0 8px 0 0; cursor: pointer; font-size: 11px; }
        .bf-count { margin-left: 8px; font-size: 10.5px; color: var(--gray-500); font-weight: 600; }
        .bf-table tfoot td { font-weight: 800; border-top: 2px solid var(--gray-200); background: var(--gray-50); }
        [data-theme="dark"] .bf-kpi, [data-theme="dark"] .bf-table .bf-sticky { background: #1a1d27; }
        [data-theme="dark"] .bf-table th, [data-theme="dark"] .bf-table th.bf-sticky,
        [data-theme="dark"] .bf-note, [data-theme="dark"] .bf-row-cat td,
        [data-theme="dark"] .bf-row-cat .bf-sticky, [data-theme="dark"] .bf-table tfoot td { background: #222633; }
      `}</style>
    </div>
  );
};

export default BeneficeFamillesTab;
