import { useState, useMemo } from "react";
import { useStatistiques } from "../../../hooks/useStatistiques";
import KpiGrid from "../../../components/statistiques/KpiGrid";
import KpiCard from "../../../components/statistiques/KpiCard";
import ChartCard from "../../../components/statistiques/ChartCard";
import DataTable from "../../../components/common/DataTable";
import ExportButton from "../../../components/common/ExportButton";
import { exportStatuts } from "../../../api/export";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";
import { informer } from "../../../utils/dialog";
// ✅ Couleurs par groupe métier
const GROUP_COLORS = {
  en_cours: "#0D6EFD",
  repare: "#198754",
  non_repare: "#DC3545",
  sortie_repare: "#20C997",
  sortie_non_repare: "#6C757D",
  sav: "#8B5CF6",
  autre: "#9CA3AF",
};

const StatutsTab = () => {
  const { data, loading, error, refetch } = useStatistiques("statuts");
  const [exporting, setExporting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelected, setClearSelected] = useState(false);

  const fmt = (num) => new Intl.NumberFormat("fr-FR").format(num || 0);

  // ============================================================
  // ✅ DATA
  // ============================================================
  const table = useMemo(() => data?.table || [], [data]);
  const grouped = useMemo(() => data?.grouped || [], [data]);
  const savBreakdown = useMemo(() => data?.sav_breakdown || [], [data]);

  // ============================================================
  // ✅ TOTAUX (sélection ou global)
  // ============================================================
  const totals = useMemo(() => {
    const source = selectedRows.length > 0 ? selectedRows : table;
    return source.reduce(
      (acc, r) => ({
        nb: acc.nb + (r.nb_reparations || 0),
        ca: acc.ca + (r.ca || 0),
        encaisse: acc.encaisse + (r.encaisse || 0),
        reste: acc.reste + (r.reste || 0),
      }),
      { nb: 0, ca: 0, encaisse: 0, reste: 0 }
    );
  }, [table, selectedRows]);

  // ============================================================
  // ✅ COLONNES
  // ============================================================
  const columns = [
    {
      name: "Statut",
      selector: (r) => r.label,
      sortable: true,
      grow: 2,
      minWidth: "180px",
      cell: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: r.color || "var(--gray-400)",
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: "600", color: "var(--gray-800)" }}>
            {r.label}
          </span>
        </div>
      ),
    },
    {
      name: "Nb réparations",
      selector: (r) => r.nb_reparations,
      sortable: true,
      center: true,
      width: "130px",
      cell: (r) => (
        <span
          style={{
            background: "var(--gray-100)",
            padding: "4px 10px",
            borderRadius: "6px",
            fontWeight: "700",
            fontSize: "12px",
          }}
        >
          {fmt(r.nb_reparations)}
        </span>
      ),
    },
    {
      name: "%",
      selector: (r) => r.percentage,
      sortable: true,
      center: true,
      width: "90px",
      cell: (r) => (
        <span
          style={{
            background: "var(--primary-light, #E7F1FF)",
            color: "var(--primary)",
            padding: "4px 10px",
            borderRadius: "6px",
            fontWeight: "700",
            fontSize: "12px",
          }}
        >
          {r.percentage}%
        </span>
      ),
    },
    {
      name: "CA",
      selector: (r) => r.ca,
      sortable: true,
      right: true,
      minWidth: "130px",
      cell: (r) => (
        <span style={{ fontWeight: "600", color: "var(--primary)" }}>
          {fmt(r.ca)} DT
        </span>
      ),
    },
    {
      name: "Encaissé",
      selector: (r) => r.encaisse,
      sortable: true,
      right: true,
      minWidth: "130px",
      cell: (r) => (
        <span style={{ color: "var(--success)" }}>{fmt(r.encaisse)} DT</span>
      ),
    },
    {
      name: "Reste",
      selector: (r) => r.reste,
      sortable: true,
      right: true,
      minWidth: "130px",
      cell: (r) => (
        <span
          style={{
            color: r.reste > 0 ? "var(--danger)" : "var(--gray-500)",
          }}
        >
          {fmt(r.reste)} DT
        </span>
      ),
    },
  ];

  // ============================================================
  // ✅ EXPORT
  // ============================================================
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const dataToExport = selectedRows.length > 0 ? selectedRows : table;
      if (dataToExport.length === 0) {
        informer({ title: "Export", message: "Aucune donnée à exporter", variant: "info" });
        return;
      }
      await exportStatuts({
        statuts: dataToExport,
        filters: {},
      });
    } catch (err) {
      console.error("Erreur export:", err);
      informer({ title: "Erreur", message: "Erreur lors de l'export", variant: "danger" });
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // ✅ ERREUR
  // ============================================================
  if (error) {
    return (
      <div className="card-modern" style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "var(--danger)" }}>⚠️ {error}</p>
        <button
          onClick={refetch}
          className="btn-modern btn-modern-primary"
          style={{ marginTop: "16px" }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* ✅ Ligne 1 : KPI globaux */}
      <KpiGrid cols={4}>
        <KpiCard
          icon="📊"
          label="Total réparations"
          value={fmt(data?.total_reparations || 0)}
        />
       <KpiCard
  icon="✅"
  label="Taux de réussite"
  value={data?.taux_reussite ?? 0}
  suffix="%"
  subtitle={`${fmt(data?.nb_sorties || 0)} livraisons`}
/>
        <KpiCard
          icon="❌"
          label="Taux d'échec"
          value={data?.taux_echec ?? 0}
          suffix="%"
        />
        <KpiCard
          icon="🔄"
          label="Taux SAV"
          value={data?.taux_sav ?? 0}
          suffix="%"
          subtitle="Retours SAV sur le total"
        />
      </KpiGrid>

      {/* ✅ Ligne 2 : Donut + Bar chart SAV */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <ChartCard
          title="🥧 Répartition par groupe de statut"
          loading={loading}
          empty={!grouped || grouped.length === 0}
          height={340}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={grouped}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={({ percentage }) => `${percentage}%`}
                labelLine={false}
              >
                {grouped.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={GROUP_COLORS[entry.key] || "#9CA3AF"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} réparations (${props.payload.percentage}%)`,
                  props.payload.label,
                ]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(v, entry) => entry.payload.label}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="🔄 Détail des statuts SAV"
          loading={loading}
          empty={!savBreakdown || savBreakdown.length === 0}
          height={340}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={savBreakdown}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="var(--gray-200)"
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="label"
                type="category"
                width={140}
                tick={{ fontSize: 11, fill: "var(--gray-600)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                formatter={(value, name, props) => [
                  `${value} réparations (${props.payload.percentage}%)`,
                  "SAV",
                ]}
              />
              <Bar dataKey="nb_reparations" radius={[0, 4, 4, 0]} barSize={22}>
                {savBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#8B5CF6" />
                ))}
                <LabelList
                  dataKey="nb_reparations"
                  position="right"
                  style={{ fontSize: 11, fill: "var(--gray-700)", fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ✅ Ligne 3 : Tableau détaillé */}
      <div className="card-modern" style={{ padding: "20px", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "var(--gray-800)",
                margin: 0,
              }}
            >
              📋 Détail par statut
            </h3>
            {selectedRows.length > 0 && (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--primary)",
                  margin: "4px 0 0 0",
                }}
              >
                {selectedRows.length} ligne(s) sélectionnée(s)
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {selectedRows.length > 0 && (
              <button
                className="btn-modern btn-modern-outline"
                onClick={() => {
                  setSelectedRows([]);
                  setClearSelected((p) => !p);
                }}
              >
                Désélectionner
              </button>
            )}
            <ExportButton
              onExport={handleExportExcel}
              label={
                selectedRows.length > 0
                  ? `Exporter (${selectedRows.length})`
                  : "Exporter Excel"
              }
              variant="success"
              disabled={exporting}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={table}
          loading={loading}
          actions={false}
          searchable={true}
          searchPlaceholder="Rechercher un statut..."
          dense={true}
          emptyMessage="Aucun statut sur cette période"
          selectableRows={true}
          onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
          clearSelectedRows={clearSelected}
        />
      </div>
    </div>
  );
};

export default StatutsTab;