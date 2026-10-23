import React, { useState, useMemo } from "react";
import { useStatistiques } from "../../../hooks/useStatistiques";
import ChartCard from "../../../components/statistiques/ChartCard";
import KpiGrid from "../../../components/statistiques/KpiGrid";
import KpiCard from "../../../components/statistiques/KpiCard";
import DataTable from "../../../components/common/DataTable";
import ExportButton from "../../../components/common/ExportButton";
import { exportCategories } from "../../../api/export";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CategoriesTab = () => {
  const { data, loading, error, refetch } = useStatistiques("categories");
  const [exporting, setExporting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelected, setClearSelected] = useState(false);

  const totals = useMemo(() => {
    const source = selectedRows.length > 0 ? selectedRows : (data?.table || []);
    return source.reduce((acc, row) => ({
      nb: acc.nb + (row.nb_reparations || 0),
      ca: acc.ca + (row.ca || 0),
      encaisse: acc.encaisse + (row.encaisse || 0),
      reste: acc.reste + (row.reste || 0),
    }), { nb: 0, ca: 0, encaisse: 0, reste: 0 });
  }, [data, selectedRows]);

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

  const fmt = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);

  const columns = [
    { name: "Catégorie", selector: (row) => row.nom, sortable: true, grow: 2, minWidth: "150px",
      cell: (row) => <span style={{ fontWeight: "600", color: "var(--gray-800)" }}>{row.nom}</span> },
    { name: "Famille", selector: (row) => row.famille, sortable: true, grow: 1, minWidth: "120px",
      cell: (row) => <span style={{ color: "var(--gray-500)" }}>{row.famille}</span> },
    { name: "Nb", selector: (row) => row.nb_reparations, sortable: true, grow: 0, minWidth: "80px", center: true,
      cell: (row) => <span style={{ background: "var(--gray-100)", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>{row.nb_reparations}</span> },
    { name: "CA", selector: (row) => row.ca, sortable: true, grow: 0, minWidth: "110px", right: true,
      cell: (row) => <span style={{ fontWeight: "600", color: "var(--primary)" }}>{fmt(row.ca)} DT</span> },
    { name: "Encaissé", selector: (row) => row.encaisse, sortable: true, grow: 0, minWidth: "110px", right: true,
      cell: (row) => <span style={{ color: "var(--success)" }}>{fmt(row.encaisse)} DT</span> },
    { name: "Reste", selector: (row) => row.reste, sortable: true, grow: 0, minWidth: "110px", right: true,
      cell: (row) => <span style={{ color: row.reste > 0 ? "var(--danger)" : "var(--gray-500)" }}>{fmt(row.reste)} DT</span> },
  ];

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const dataToExport = selectedRows.length > 0 ? selectedRows : (data?.table || []);
      if (dataToExport.length === 0) return alert("Aucune donnée à exporter");
      await exportCategories({ categories: dataToExport });
    } catch (err) {
      console.error("Erreur export:", err);
      alert("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedRows([]);
    setClearSelected((prev) => !prev);
  };

  return (
    <div>
      {/* 1. Graphique Barres */}
      <div style={{ marginBottom: "20px" }}>
        <ChartCard
          title="📊 Chiffre d'Affaires par Catégorie (Top 10)"
          loading={loading}
          empty={!data?.bar || data.bar.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.bar} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
              <XAxis dataKey="nom" tick={{ fontSize: 12, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'var(--gray-100)' }} formatter={(value) => [`${fmt(value)} DT`, "CA"]} />
              <Bar dataKey="ca" name="CA" fill="var(--primary, #3b82f6)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 2. ✅ KPI dynamiques (SOUS le graphique) */}
      <KpiGrid cols={4}>
        <KpiCard
          icon="🔧"
          label={selectedRows.length > 0 ? `Nb réparations (${selectedRows.length} sél.)` : "Nb réparations"}
          value={fmt(totals.nb)}
        />
        <KpiCard icon="💰" label="Chiffre d'Affaires" value={fmt(totals.ca)} suffix=" DT" />
        <KpiCard icon="💵" label="Total Encaissé" value={fmt(totals.encaisse)} suffix=" DT" />
        <KpiCard icon="📉" label="Reste à recevoir" value={fmt(totals.reste)} suffix=" DT" />
      </KpiGrid>

      {/* 3. Tableau + Export */}
      <div className="card-modern" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--gray-800)", margin: 0 }}>
              📋 Détail par Catégorie de Panne
            </h3>
            {selectedRows.length > 0 && (
              <p style={{ fontSize: "12px", color: "var(--primary)", margin: "4px 0 0 0" }}>
                {selectedRows.length} ligne(s) sélectionnée(s)
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {selectedRows.length > 0 && (
              <button className="btn-modern btn-modern-outline" onClick={handleClearSelection}>
                Désélectionner
              </button>
            )}
            <ExportButton
              onExport={handleExportExcel}
              label={selectedRows.length > 0 ? `Exporter (${selectedRows.length})` : "Exporter Excel"}
              variant="success"
              disabled={exporting}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.table || []}
          loading={loading}
          actions={false}
          searchable={true}
          searchPlaceholder="Rechercher une catégorie..."
          paginationPerPage={15}
          dense={true}
          emptyMessage="Aucune donnée pour cette période"
          selectableRows={true}
          onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
          clearSelectedRows={clearSelected}
        />
      </div>
    </div>
  );
};

export default CategoriesTab;