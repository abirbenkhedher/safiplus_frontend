import React, { useState, useMemo } from "react";
import { useStatistiques } from "../../../hooks/useStatistiques";
import KpiGrid from "../../../components/statistiques/KpiGrid";
import KpiCard from "../../../components/statistiques/KpiCard";
import DataTable from "../../../components/common/DataTable";
import MultiSelect from "../../../components/common/MultiSelect";
import ExportButton from "../../../components/common/ExportButton";
import { exportAppareils } from "../../../api/export";
import { FaFilter } from "react-icons/fa";

const AppareilsTab = () => {
  // ============================================================
  // ✅ HOOKS EN PREMIER
  // ============================================================
  const { data, loading, error, refetch } = useStatistiques("appareils");
  const [exporting, setExporting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelected, setClearSelected] = useState(false);

  // Filtres locaux (multi-sélection)
  const [filterFamille, setFilterFamille] = useState([]);
  const [filterCategorie, setFilterCategorie] = useState([]);
  const [filterObjet, setFilterObjet] = useState([]);
  const [filterMarque, setFilterMarque] = useState([]);
  const [filterModele, setFilterModele] = useState([]);

  // Extraction des options uniques
  const options = useMemo(() => {
    const table = data?.table || [];
    return {
      familles: [...new Set(table.map(r => r.famille).filter(Boolean))].sort(),
      categories: [...new Set(table.map(r => r.categorie).filter(Boolean))].sort(),
      objets: [...new Set(table.map(r => r.objet).filter(Boolean))].sort(),
      marques: [...new Set(table.map(r => r.marque).filter(Boolean))].sort(),
      modeles: [...new Set(table.map(r => r.modele).filter(Boolean))].sort(),
    };
  }, [data]);

  // Filtrage
  const filteredTable = useMemo(() => {
    let rows = data?.table || [];
    if (filterFamille.length > 0) rows = rows.filter(r => filterFamille.includes(r.famille));
    if (filterCategorie.length > 0) rows = rows.filter(r => filterCategorie.includes(r.categorie));
    if (filterObjet.length > 0) rows = rows.filter(r => filterObjet.includes(r.objet));
    if (filterMarque.length > 0) rows = rows.filter(r => filterMarque.includes(r.marque));
    if (filterModele.length > 0) rows = rows.filter(r => filterModele.includes(r.modele));
    return rows;
  }, [data, filterFamille, filterCategorie, filterObjet, filterMarque, filterModele]);

  // ============================================================
  // ✅ CALCUL DES TOTAUX (dynamique : sélection ou global)
  // ============================================================
  const totals = useMemo(() => {
    // Si des lignes sont sélectionnées → on calcule sur la sélection
    // Sinon → on calcule sur toutes les lignes filtrées
    const source = selectedRows.length > 0 ? selectedRows : filteredTable;
    return source.reduce((acc, row) => ({
      nb: acc.nb + (row.nb_reparations || 0),
      ca: acc.ca + (row.ca || 0),
      encaisse: acc.encaisse + (row.encaisse || 0),
      reste: acc.reste + (row.reste || 0),
    }), { nb: 0, ca: 0, encaisse: 0, reste: 0 });
  }, [filteredTable, selectedRows]);

  // ============================================================
  // ✅ RETOURS CONDITIONNELS
  // ============================================================
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

  // ============================================================
  // ✅ COLONNES
  // ============================================================
  const columns = [
    { name: "Famille", selector: (row) => row.famille, sortable: true, grow: 1, minWidth: "100px",
      cell: (row) => <span style={{ fontWeight: "600", color: "var(--gray-800)" }}>{row.famille}</span> },
    { name: "Catégorie", selector: (row) => row.categorie, sortable: true, grow: 1, minWidth: "120px",
      cell: (row) => <span style={{ color: "var(--gray-600)" }}>{row.categorie}</span> },
    { name: "Objet", selector: (row) => row.objet, sortable: true, grow: 1, minWidth: "120px",
      cell: (row) => <span style={{ color: "var(--gray-600)" }}>{row.objet}</span> },
    { name: "Marque", selector: (row) => row.marque, sortable: true, grow: 1, minWidth: "100px",
      cell: (row) => <span style={{ color: "var(--gray-700)" }}>{row.marque}</span> },
    { name: "Modèle", selector: (row) => row.modele, sortable: true, grow: 1, minWidth: "120px",
      cell: (row) => <span style={{ color: "var(--gray-600)" }}>{row.modele}</span> },
    { name: "Nb", selector: (row) => row.nb_reparations, sortable: true, grow: 0, minWidth: "70px", center: true,
      cell: (row) => <span style={{ background: "var(--gray-100)", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>{row.nb_reparations}</span> },
    { name: "CA", selector: (row) => row.ca, sortable: true, grow: 0, minWidth: "100px", right: true,
      cell: (row) => <span style={{ fontWeight: "600", color: "var(--primary)" }}>{fmt(row.ca)} DT</span> },
    { name: "Encaissé", selector: (row) => row.encaisse, sortable: true, grow: 0, minWidth: "100px", right: true,
      cell: (row) => <span style={{ color: "var(--success)" }}>{fmt(row.encaisse)} DT</span> },
    { name: "Reste", selector: (row) => row.reste, sortable: true, grow: 0, minWidth: "100px", right: true,
      cell: (row) => <span style={{ color: row.reste > 0 ? "var(--danger)" : "var(--gray-500)" }}>{fmt(row.reste)} DT</span> },
  ];

  // ============================================================
  // ✅ EXPORT EXCEL
  // ============================================================
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const dataToExport = selectedRows.length > 0 ? selectedRows : filteredTable;
      if (dataToExport.length === 0) {
        alert("Aucune donnée à exporter");
        return;
      }
      await exportAppareils({
        appareils: dataToExport,
        filters: {
          famille: filterFamille.join(", "),
          categorie: filterCategorie.join(", "),
          objet: filterObjet.join(", "),
          marque: filterMarque.join(", "),
          modele: filterModele.join(", "),
        },
      });
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
      {/* ✅ KPI dynamiques (changent si sélection) */}
      <KpiGrid cols={4}>
        <KpiCard
          icon="📱"
          label={selectedRows.length > 0 ? `Nb réparations (${selectedRows.length} sél.)` : "Nb réparations"}
          value={fmt(totals.nb)}
        />
        <KpiCard icon="💰" label="Chiffre d'Affaires" value={fmt(totals.ca)} suffix=" DT" />
        <KpiCard icon="💵" label="Total Encaissé" value={fmt(totals.encaisse)} suffix=" DT" />
        <KpiCard icon="📉" label="Reste à recevoir" value={fmt(totals.reste)} suffix=" DT" />
      </KpiGrid>

      {/* Carte principale */}
      <div className="card-modern" style={{ padding: "20px", width: "100%", overflowX: "hidden" }}>
        {/* En-tête : Titre + Export */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--gray-800)", margin: 0 }}>
              📋 Détail par Appareil
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

        {/* Filtres multi-sélection */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
          paddingBottom: "16px",
          borderBottom: "1px dashed var(--gray-200)",
        }}>
          <MultiSelect label="Famille" icon={<FaFilter size={10} />} options={options.familles.map(f => ({ value: f, label: f }))} value={filterFamille} onChange={setFilterFamille} placeholder="Toutes" />
          <MultiSelect label="Catégorie" icon={<FaFilter size={10} />} options={options.categories.map(c => ({ value: c, label: c }))} value={filterCategorie} onChange={setFilterCategorie} placeholder="Toutes" />
          <MultiSelect label="Objet" icon={<FaFilter size={10} />} options={options.objets.map(o => ({ value: o, label: o }))} value={filterObjet} onChange={setFilterObjet} placeholder="Tous" />
          <MultiSelect label="Marque" icon={<FaFilter size={10} />} options={options.marques.map(m => ({ value: m, label: m }))} value={filterMarque} onChange={setFilterMarque} placeholder="Toutes" />
          <MultiSelect label="Modèle" icon={<FaFilter size={10} />} options={options.modeles.map(m => ({ value: m, label: m }))} value={filterModele} onChange={setFilterModele} placeholder="Tous" />
        </div>

        {/* Tableau avec sélection multiple */}
        <div style={{ width: "100%" }}>
          <DataTable
            columns={columns}
            data={filteredTable}
            loading={loading}
            actions={false}
            searchable={true}
            searchPlaceholder="Rechercher par famille, catégorie, marque..."
            paginationPerPage={15}
            dense={true}
            emptyMessage="Aucune donnée pour cette période"
            selectableRows={true}
            onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
            clearSelectedRows={clearSelected}
          />
        </div>
      </div>
    </div>
  );
};

export default AppareilsTab;