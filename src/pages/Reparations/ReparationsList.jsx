import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaTimes,
  FaTools, FaCheckCircle, FaSpinner, FaPrint,
  FaMoneyBillWave, FaMapMarkerAlt, FaFilter, FaBoxes,
} from "react-icons/fa";
import { getReparations, deleteReparation } from "../../api/reparations";
import { getStatuses } from "../../api/statuses";
import { getUsers } from "../../api/users";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DataTable from "../../components/common/DataTable";
import ExportButton from "../../components/common/ExportButton";
import { exportReparations } from "../../api/export";
import { useReparationModal } from "../../context/ReparationModalContext";
import { useReparationData } from "../../hooks/useReparationData"; // ✅ pour les catégories

const STATUTS_TERMINES = [
  "REPARE", "NON REPARE", "SORTIE NON REPARE", "SAV",
  "SORTIE REPARE", "SAV REPARE", "SAV NON REPARE",
  "SAV SORTIE REPARE", "SAV SORTIE NON REPARE",
];

const STATUT_EN_COURS = "EN COURS";

const ReparationsList = () => {
  const navigate = useNavigate();
  const { openNewReparation, openEditReparation, registerOnSuccess } = useReparationModal();

  // ✅ Catégories depuis le hook global (cache partagé)
  const { categories } = useReparationData();

  const [reparations, setReparations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    categorie: "",     // ✅ NOUVEAU
    reparateur: "",
    adresse: "",
    dateDebut: "",
    dateFin: "",
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReparation, setSelectedReparation] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleNew = () => openNewReparation();
  const handleEdit = (rep) => openEditReparation(rep);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach((k) => {
        if (filters[k] && filters[k].trim() !== "") params[k] = filters[k];
      });
      const [repRes, statusesRes, usersRes] = await Promise.all([
        getReparations(params), getStatuses(), getUsers(),
      ]);
      setReparations(repRes.data);
      setStatuses(statusesRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const unregister = registerOnSuccess(() => {
      loadData();
    });
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "",
      categorie: "",
      reparateur: "",
      adresse: "",
      dateDebut: "",
      dateFin: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v.trim() !== ""
  );

  // ✅ Nombre de filtres actifs (pour badge)
  const activeCount = Object.values(filters).filter(
    (v) => v && v.trim() !== ""
  ).length;

  const handleDelete = async () => {
    try {
      await deleteReparation(selectedReparation._id);
      setSuccess("Réparation supprimée avec succès");
      setShowDeleteDialog(false);
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur");
      setShowDeleteDialog(false);
    }
  };

  const handleExportExcel = async () => {
    const params = {};
    Object.keys(filters).forEach((k) => {
      if (filters[k] && filters[k].trim() !== "") params[k] = filters[k];
    });
    await exportReparations(params);
  };

  const stats = useMemo(() => {
    const total = reparations.length;
    const impayees = reparations.filter((r) => {
      const prixTotal = r.prixTotal || r.prix || 0;
      const acompte = r.acompte || 0;
      return prixTotal - acompte > 0;
    }).length;
    const enCours = reparations.filter((r) => {
      const label = r.status?.label?.trim().toUpperCase().replace(/\s+/g, " ");
      return label === STATUT_EN_COURS;
    }).length;
    const terminees = reparations.filter((r) => {
      const label = r.status?.label?.trim().toUpperCase().replace(/\s+/g, " ");
      return STATUTS_TERMINES.includes(label);
    }).length;
    return { total, impayees, enCours, terminees };
  }, [reparations]);

  // ✅ Catégories triées par ordre
  const categoriesTriees = useMemo(
    () =>
      [...categories].sort(
        (a, b) =>
          (a.ordre ?? 0) - (b.ordre ?? 0) ||
          (a.nom || "").localeCompare(b.nom || "")
      ),
    [categories]
  );

  // ============================================================
  // COLONNES — Compactes pour éviter le scroll horizontal
  // ============================================================
  const columns = [
    {
      name: "N°",
      selector: (row) => row.numero,
      sortable: true,
      width: "100px",   // ✅ réduit
      cell: (row) => (
        <span
          className="badge-modern badge-modern-primary"
          style={{ fontSize: "10px", fontFamily: "monospace", padding: "3px 7px" }}
        >
          {row.numero}
        </span>
      ),
    },
    {
      name: "Client",
      selector: (row) => row.client?.nom,
      sortable: true,
      grow: 2,
      minWidth: "170px", // ✅ réduit
      cell: (row) => (
        <div style={{ padding: "2px 0" }}>
          <div style={{ fontWeight: "600", fontSize: "12.5px", color: "var(--gray-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.client?.nom || "N/A"}
          </div>
          {row.client?.phone && (
            <div style={{ fontSize: "10.5px", color: "var(--gray-500)", marginTop: "1px" }}>
              📞 {row.client.phone}
            </div>
          )}
          {row.client?.adresse && (
            <div style={{ fontSize: "10px", color: "var(--gray-400)", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <FaMapMarkerAlt size={8} /> {row.client.adresse}
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Appareil",
      selector: (row) => `${row.marque?.nom || ""} ${row.modele?.nom || ""}`.trim(),
      sortable: true,
      grow: 1.5,
      minWidth: "140px", // ✅ réduit
      cell: (row) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: "600", fontSize: "12.5px", color: "var(--gray-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.marque?.nom || "-"} {row.modele?.nom || ""}
          </div>
          <div style={{ fontSize: "10.5px", color: "var(--gray-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.objet?.nom}
          </div>
        </div>
      ),
    },
    {
      name: "Panne(s)",
      selector: (row) => {
        if (Array.isArray(row.panneType)) return row.panneType.join(", ");
        return row.panneType || "";
      },
      sortable: true,
      grow: 1.5,
      minWidth: "150px", // ✅ réduit
      cell: (row) => {
        const pannes = Array.isArray(row.panneType)
          ? row.panneType
          : row.panneType ? [row.panneType] : [];
        if (pannes.length === 0) {
          return <span style={{ fontSize: "11px", color: "var(--gray-400)", fontStyle: "italic" }}>-</span>;
        }
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
            {pannes.slice(0, 2).map((p, i) => (
              <span
                key={i}
                style={{
                  padding: "2px 6px",
                  background: "var(--warning-light)",
                  color: "var(--warning)",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  maxWidth: "100px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p}
              </span>
            ))}
            {pannes.length > 2 && (
              <span
                style={{
                  padding: "2px 6px",
                  background: "var(--gray-200)",
                  color: "var(--gray-700)",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: "700",
                }}
                title={pannes.slice(2).join(", ")}
              >
                +{pannes.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      name: "Statut",
      selector: (row) => row.status?.label,
      sortable: true,
      center: true,
      width: "140px", // ✅ réduit
      cell: (row) => {
        const imprevusEnAttente = row.imprevusEnAttente || 0;
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
            <span
              className="badge-modern"
              style={{
                background: row.status?.color || "var(--gray-500)",
                color: "white",
                whiteSpace: "nowrap",
                fontSize: "10px",
                padding: "3px 8px",
              }}
            >
              {row.status?.label || "N/A"}
            </span>
            {imprevusEnAttente > 0 && (
              <span style={{ fontSize: "9px", fontWeight: "700", color: "var(--warning)", background: "var(--warning-light)", padding: "1px 5px", borderRadius: "6px" }}>
                ⚠️ {imprevusEnAttente}
              </span>
            )}
          </div>
        );
      },
    },
    {
      name: "Prix",
      selector: (row) => row.prix,
      sortable: true,
      width: "85px",  // ✅ réduit
      right: true,
      cell: (row) => (
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: "700", fontSize: "12.5px", color: "var(--gray-800)" }}>
            {(row.prixTotal || row.prix || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: "9.5px", color: "var(--gray-500)" }}>DT</div>
        </div>
      ),
    },
    {
      name: "Reste",
      selector: (row) => (row.prix || 0) - (row.acompte || 0),
      sortable: true,
      width: "85px",  // ✅ réduit
      right: true,
      cell: (row) => {
        const reste = (row.prixTotal || row.prix || 0) - (row.acompte || 0);
        return (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "700", fontSize: "12.5px", color: reste > 0 ? "var(--danger)" : "var(--success)" }}>
              {reste.toFixed(2)}
            </div>
            <div style={{ fontSize: "9.5px", color: "var(--gray-500)" }}>DT</div>
          </div>
        );
      },
    },
    {
      name: "Réparateur",
      selector: (row) => row.reparateur?.firstName,
      sortable: true,
      width: "120px", // ✅ réduit
      cell: (row) =>
        row.reparateur ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: "700",
                flexShrink: 0,
              }}
            >
              {row.reparateur.firstName?.charAt(0)}
              {row.reparateur.lastName?.charAt(0)}
            </div>
            <span style={{ fontSize: "11.5px", color: "var(--gray-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {row.reparateur.firstName}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: "11px", color: "var(--gray-400)", fontStyle: "italic" }}>—</span>
        ),
    },
    {
      name: "Date",
      selector: (row) => row.createdAt,
      sortable: true,
      width: "90px",  // ✅ réduit
      cell: (row) => (
        <span style={{ fontSize: "11px", color: "var(--gray-600)" }}>
          {new Date(row.createdAt).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      name: "Actions",
      center: true,
      width: "130px", // ✅ réduit
      cell: (row) => (
        <div style={{ display: "flex", gap: "3px", justifyContent: "center" }}>
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/reparations/${row._id}`); }} title="Voir">
            <FaEye size={11} />
          </button>
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleEdit(row); }} title="Modifier">
            <FaEdit size={11} />
          </button>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              const token = localStorage.getItem("accessToken");
              const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
              fetch(`${apiUrl}/reparations/${row._id}/ticket`, {
                headers: { Authorization: `Bearer ${token}` },
              })
                .then((res) => res.text())
                .then((html) => {
                  const win = window.open("", "_blank", "width=400,height=600");
                  win.document.write(html);
                  win.document.close();
                  win.onload = () => setTimeout(() => win.print(), 500);
                });
            }}
            title="Imprimer"
          >
            <FaPrint size={11} />
          </button>
          <button
            className="btn-icon btn-icon-danger"
            onClick={(e) => { e.stopPropagation(); setSelectedReparation(row); setShowDeleteDialog(true); }}
            title="Supprimer"
          >
            <FaTrash size={11} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in-up">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--gray-900)", marginBottom: "4px" }}>
            Réparations
          </h1>
          <p style={{ fontSize: "13px", color: "var(--gray-500)", margin: 0 }}>
            {reparations.length} réparation(s) • {stats.enCours} en cours
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <ExportButton onExport={handleExportExcel} label="Excel" />
          <button className="btn-modern btn-modern-primary" onClick={handleNew}>
            <FaPlus /> Nouvelle réparation
          </button>
        </div>
      </div>

      {success && (
        <div style={{ padding: "12px 16px", background: "var(--success-light)", color: "var(--success)", borderRadius: "10px", marginBottom: "20px", fontSize: "13px", fontWeight: "500" }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div style={{ padding: "12px 16px", background: "var(--danger-light)", color: "var(--danger)", borderRadius: "10px", marginBottom: "20px", fontSize: "13px", fontWeight: "500" }}>
          ⚠️ {error}
        </div>
      )}

      {/* CARTES STATS */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total", value: stats.total, icon: <FaTools />, color: "#4361ee", bg: "rgba(67, 97, 238, 0.1)" },
          { label: "Impayées", value: stats.impayees, icon: <FaMoneyBillWave />, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
          { label: "En cours", value: stats.enCours, icon: <FaSpinner />, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
          { label: "Terminées", value: stats.terminees, icon: <FaCheckCircle />, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
        ].map((stat, i) => (
          <div key={i} className="col-6 col-lg-3">
            <div style={{ background: "var(--gray-50)", border: "1px solid var(--gray-200)", borderRadius: "16px", padding: "18px", display: "flex", alignItems: "center", gap: "14px", transition: "all 200ms ease" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: stat.bg, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--gray-900)", lineHeight: 1 }}>
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* BARRE DE FILTRES RÉORGANISÉE */}
      {/* ============================================================ */}
      <div className="card-modern mb-3" style={{ padding: "18px 20px" }}>
        {/* Ligne 1 : Recherche principale + bouton reset */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 320px", minWidth: 0 }}>
            <FaSearch
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--gray-400)",
                fontSize: "13px",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              name="search"
              className="form-control-modern"
              style={{ paddingLeft: "40px", width: "100%", height: "44px" }}
              placeholder="Rechercher : N°, client, téléphone, marque, panne..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          {hasActiveFilters && (
            <button
              className="btn-modern btn-modern-outline"
              style={{ height: "44px", padding: "0 18px", whiteSpace: "nowrap" }}
              onClick={resetFilters}
              title="Réinitialiser les filtres"
            >
              <FaTimes size={12} /> Effacer {activeCount > 0 && `(${activeCount})`}
            </button>
          )}
        </div>

        {/* Ligne 2 : Filtres secondaires groupés */}
        <div className="filters-grid-2">
          {/* Catégorie */}
          <div className="filter-item">
            <label className="filter-label">
              <FaBoxes size={10} /> Catégorie
            </label>
            <select
              name="categorie"
              className="form-control-modern"
              style={{ height: "42px" }}
              value={filters.categorie}
              onChange={handleFilterChange}
            >
              <option value="">Toutes</option>
              {categoriesTriees.map((c) => (
                <option key={c._id} value={c._id}>{c.nom}</option>
              ))}
            </select>
          </div>

          {/* Statut */}
          <div className="filter-item">
            <label className="filter-label">
              <FaFilter size={10} /> Statut
            </label>
            <select
              name="status"
              className="form-control-modern"
              style={{ height: "42px" }}
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">Tous</option>
              {statuses.map((s) => (
                <option key={s._id} value={s._id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Réparateur */}
          <div className="filter-item">
            <label className="filter-label">
              <FaTools size={10} /> Réparateur
            </label>
            <select
              name="reparateur"
              className="form-control-modern"
              style={{ height: "42px" }}
              value={filters.reparateur}
              onChange={handleFilterChange}
            >
              <option value="">Tous</option>
              {users
                .filter((u) => u.role === "REPARATEUR")
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
            </select>
          </div>

          {/* Adresse */}
          <div className="filter-item">
            <label className="filter-label">
              <FaMapMarkerAlt size={10} /> Adresse
            </label>
            <input
              type="text"
              name="adresse"
              className="form-control-modern"
              style={{ height: "42px" }}
              placeholder="Filtrer..."
              value={filters.adresse}
              onChange={handleFilterChange}
            />
          </div>

          {/* Date début */}
          <div className="filter-item">
            <label className="filter-label">Du</label>
            <input
              type="date"
              name="dateDebut"
              className="form-control-modern"
              style={{ height: "42px" }}
              value={filters.dateDebut}
              onChange={handleFilterChange}
            />
          </div>

          {/* Date fin */}
          <div className="filter-item">
            <label className="filter-label">Au</label>
            <input
              type="date"
              name="dateFin"
              className="form-control-modern"
              style={{ height: "42px" }}
              value={filters.dateFin}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        {/* Info résultats */}
        {hasActiveFilters && (
          <div style={{ marginTop: "12px", fontSize: "11.5px", color: "var(--gray-500)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🔎</span>
            <span>{reparations.length} résultat(s) avec filtres actifs</span>
          </div>
        )}
      </div>

      {/* TABLEAU — avec wrapper pour forcer la largeur */}
      <div style={{ width: "100%", overflow: "hidden" }}>
        <DataTable
          columns={columns}
          data={reparations}
          loading={loading}
          actions={false}
          searchable={false}
          onRowClicked={(row) => navigate(`/reparations/${row._id}`)}
          emptyMessage="Aucune réparation trouvée"
          paginationPerPage={10}
          dense={true}
        />
      </div>

      <ConfirmDialog
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer la réparation"
        message={`Êtes-vous sûr de vouloir supprimer la réparation ${selectedReparation?.numero} ?`}
        confirmText="Supprimer"
      />

      <style>{`
        /* ✅ Grille de filtres secondaires */
        .filters-grid-2 {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          align-items: end;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .filter-label {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding-left: 2px;
        }

        /* ✅ Responsive */
        @media (max-width: 1400px) {
          .filters-grid-2 { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 992px) {
          .filters-grid-2 { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 576px) {
          .filters-grid-2 { grid-template-columns: 1fr; }
          .filters-grid-2 > * { width: 100% !important; }
        }

        /* ✅ Tableau plus compact */
        .rdt_TableHeadRow {
          min-height: 42px !important;
        }

        .rdt_TableRow {
          min-height: 52px !important;
        }

        .rdt_TableCell {
          padding: 8px 10px !important;
          font-size: 12.5px !important;
        }

        .rdt_TableCol {
          padding: 8px 10px !important;
        }

        /* ✅ Empêcher le scroll horizontal du tableau */
        .rdt_TableWrapper {
          width: 100% !important;
          overflow-x: hidden !important;
        }

        .rdt_Table {
          width: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default ReparationsList;