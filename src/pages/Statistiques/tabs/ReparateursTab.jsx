import React, { useState, useMemo } from "react";
import { useStatistiques } from "../../../hooks/useStatistiques";
import KpiGrid from "../../../components/statistiques/KpiGrid";
import KpiCard from "../../../components/statistiques/KpiCard";
import ChartCard from "../../../components/statistiques/ChartCard";
import DataTable from "../../../components/common/DataTable";
import ExportButton from "../../../components/common/ExportButton";
import { exportReparateurs } from "../../../api/export";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, LabelList
} from "recharts";

const ReparateursTab = () => {
  const { data, loading, error, refetch } = useStatistiques("reparateurs");
  const [exporting, setExporting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelected, setClearSelected] = useState(false);

  const fmt = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);

  // ✅ Couleurs conditionnelles basées sur le taux SAV
  const getTauxColor = (taux) => {
    if (taux >= 30) return "var(--danger)";
    if (taux >= 15) return "var(--warning)";
    if (taux >= 5) return "var(--info)";
    return "var(--success)";
  };

  const getTauxBg = (taux) => {
    if (taux >= 30) return "var(--danger-light)";
    if (taux >= 15) return "var(--warning-light)";
    if (taux >= 5) return "var(--info-light)";
    return "var(--success-light)";
  };

  // ✅ Colonnes du tableau
  const columns = [
    {
      name: "Réparateur",
      selector: (row) => row.nom,
      sortable: true,
      grow: 2,
      minWidth: "180px",
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              color: "white", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0,
            }}
          >
            {row.nom?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <div style={{ fontWeight: "600", color: "var(--gray-800)", fontSize: "13px" }}>
              {row.nom}
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--gray-500)" }}>
              {row.role}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Réparations",
      selector: (row) => row.total_reparations,
      sortable: true,
      center: true,
      width: "120px",
      cell: (row) => (
        <span style={{
          background: "var(--gray-100)", padding: "4px 10px",
          borderRadius: "6px", fontWeight: "700", fontSize: "12px"
        }}>
          {fmt(row.total_reparations)}
        </span>
      ),
    },
    {
      name: "SAV (retours)",
      selector: (row) => row.total_sav,
      sortable: true,
      center: true,
      width: "120px",
      cell: (row) => (
        <span style={{
          background: row.total_sav > 0 ? "var(--danger-light)" : "var(--gray-100)",
          color: row.total_sav > 0 ? "var(--danger)" : "var(--gray-500)",
          padding: "4px 10px", borderRadius: "6px", fontWeight: "700", fontSize: "12px"
        }}>
          {fmt(row.total_sav)}
        </span>
      ),
    },
    {
      name: "Taux SAV",
      selector: (row) => row.taux_sav,
      sortable: true,
      center: true,
      width: "120px",
      cell: (row) => (
        <span style={{
          background: getTauxBg(row.taux_sav),
          color: getTauxColor(row.taux_sav),
          padding: "4px 10px", borderRadius: "6px",
          fontWeight: "700", fontSize: "12px",
        }}>
          {row.taux_sav}%
        </span>
      ),
    },
    {
      name: "CA généré",
      selector: (row) => row.ca_total,
      sortable: true,
      right: true,
      minWidth: "130px",
      cell: (row) => (
        <span style={{ fontWeight: "600", color: "var(--primary)" }}>
          {fmt(row.ca_total)} DT
        </span>
      ),
    },
    {
      name: "Encaissé",
      selector: (row) => row.encaisse,
      sortable: true,
      right: true,
      minWidth: "120px",
      cell: (row) => (
        <span style={{ color: "var(--success)" }}>
          {fmt(row.encaisse)} DT
        </span>
      ),
    },
    {
      name: "Reste",
      selector: (row) => row.reste,
      sortable: true,
      right: true,
      minWidth: "120px",
      cell: (row) => (
        <span style={{ color: row.reste > 0 ? "var(--danger)" : "var(--gray-500)" }}>
          {fmt(row.reste)} DT
        </span>
      ),
    },
  ];

  const reparateurs = data?.reparateurs || [];
  const topRetours = data?.top_retours || [];
  const pireReparateur = data?.pire_reparateur;

  const totals = useMemo(() => {
    const source = selectedRows.length > 0 ? selectedRows : reparateurs;
    return source.reduce((acc, r) => ({
      reparations: acc.reparations + (r.total_reparations || 0),
      sav: acc.sav + (r.total_sav || 0),
      ca: acc.ca + (r.ca_total || 0),
      encaisse: acc.encaisse + (r.encaisse || 0),
    }), { reparations: 0, sav: 0, ca: 0, encaisse: 0 });
  }, [reparateurs, selectedRows]);

  // ✅ Handler d'export Excel
  const handleExport = async () => {
    try {
      setExporting(true);

      // Si des lignes sont sélectionnées → on exporte uniquement celles-là
      const dataToExport = selectedRows.length > 0 ? selectedRows : reparateurs;

      await exportReparateurs({
        reparateurs: dataToExport,
        filters: {
          // Ajoutez ici vos filtres actifs si vous en avez
          // Ex: periode: filters.periode, dateDebut: filters.dateDebut, ...
        },
        // On inclut le top 10 retours SAV uniquement lors d'un export complet
        topRetours: selectedRows.length > 0 ? [] : topRetours,
      });
    } catch (err) {
      console.error("Erreur export réparateurs:", err);
      alert("Erreur lors de l'export Excel");
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <div className="card-modern" style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "var(--danger)" }}>⚠️ {error}</p>
        <button onClick={refetch} className="btn-modern btn-modern-primary" style={{ marginTop: "16px" }}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ✅ Ligne 1 : KPI globaux */}
      <KpiGrid cols={3}>
        <KpiCard
          icon="👨‍🔧"
          label="Réparateurs actifs"
          value={fmt(data?.total_reparateurs || 0)}
        />
        <KpiCard
          icon="🔄"
          label="Taux SAV global"
          value={data?.taux_sav_global ?? 0}
          suffix="%"
        />
        <KpiCard
          icon="🚨"
          label="Pire réparateur (SAV)"
          value={pireReparateur?.nom || "—"}
          subtitle={pireReparateur ? `${pireReparateur.total_sav} retours (${pireReparateur.taux_sav}%)` : ""}
        />
      </KpiGrid>

      {/* ✅ Ligne 2 : Graphique Top 10 retours SAV */}
      <div style={{ marginBottom: "20px" }}>
        <ChartCard
          title="🔄 Top 10 des réparateurs avec le plus de retours SAV"
          loading={loading}
          empty={!topRetours || topRetours.length === 0}
          height={350}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topRetours}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--gray-200)" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="nom"
                type="category"
                width={130}
                tick={{ fontSize: 11, fill: "var(--gray-600)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                formatter={(value, name, props) => [
                  `${value} retours (${props.payload.taux_sav}%)`,
                  "SAV"
                ]}
              />
              <Bar dataKey="total_sav" radius={[0, 4, 4, 0]} barSize={22}>
                {topRetours.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.taux_sav >= 30 ? "var(--danger)" :
                      entry.taux_sav >= 15 ? "var(--warning)" :
                      entry.taux_sav >= 5 ? "var(--info)" :
                      "var(--success)"
                    }
                  />
                ))}
                <LabelList
                  dataKey="total_sav"
                  position="right"
                  style={{ fontSize: 11, fill: "var(--gray-700)", fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ✅ Ligne 3 : Tableau détaillé */}
      <div className="card-modern" style={{ padding: "20px", width: "100%", overflowX: "hidden" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "12px", marginBottom: "16px"
        }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--gray-800)", margin: 0 }}>
              📋 Classement des réparateurs
            </h3>
            {selectedRows.length > 0 && (
              <p style={{ fontSize: "12px", color: "var(--primary)", margin: "4px 0 0 0" }}>
                {selectedRows.length} ligne(s) sélectionnée(s)
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {selectedRows.length > 0 && (
              <button
                className="btn-modern btn-modern-outline"
                onClick={() => { setSelectedRows([]); setClearSelected(prev => !prev); }}
              >
                Désélectionner
              </button>
            )}
            <ExportButton
              label="Export Excel"
              disabled={exporting}
              onExport={handleExport}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={reparateurs}
          loading={loading}
          actions={false}
          searchable={true}
          searchPlaceholder="Rechercher un réparateur..."
          paginationPerPage={15}
          dense={true}
          emptyMessage="Aucun réparateur sur cette période"
          selectableRows={true}
          onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
          clearSelectedRows={clearSelected}
        />
      </div>
    </div>
  );
};

export default ReparateursTab;