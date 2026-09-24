import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaTimes,
  FaTools, FaCheckCircle, FaSpinner, FaPrint,
  FaMoneyBillWave, FaMapMarkerAlt,
} from "react-icons/fa";
import { getReparations, deleteReparation } from "../../api/reparations";
import { getStatuses } from "../../api/statuses";
import { getUsers } from "../../api/users";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DataTable from "../../components/common/DataTable";
import ExportButton from "../../components/common/ExportButton";
import { exportReparations } from "../../api/export";
import ReparationModal from "../../components/reparations/ReparationModal";

// ============================================================
// ✅ STATUTS CONSIDÉRÉS COMME "TERMINÉS"
// ============================================================
const STATUTS_TERMINES = [
  "REPARE",
  "NON REPARE",
  "SORTIE NON REPARE",
  "SAV",
  "SORTIE REPARE",
  "SAV REPARE",
  "SAV NON REPARE",
  "SAV SORTIE REPARE",
  "SAV SORTIE NON REPARE",
];

const STATUT_EN_COURS = "EN COURS";

const ReparationsList = () => {
  const navigate = useNavigate();
  const [reparations, setReparations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Tous les filtres sur une seule ligne (avec ADRESSE)
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    reparateur: "",
    adresse: "",
    dateDebut: "",
    dateFin: "",
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReparation, setSelectedReparation] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingReparation, setEditingReparation] = useState(null);

  const handleNew = () => { setEditingReparation(null); setShowModal(true); };
  const handleEdit = (rep) => { setEditingReparation(rep); setShowModal(true); };
  const handleSuccess = () => { loadData(); };

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

  // ✅ Recharger quand les filtres changent
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "",
      reparateur: "",
      adresse: "",
      dateDebut: "",
      dateFin: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v.trim() !== ""
  );

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

  // ============================================================
  // STATISTIQUES
  // ============================================================
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

  const columns = [
    {
      name: "N°",
      selector: (row) => row.numero,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <span className="badge-modern badge-modern-primary" style={{ fontSize: "10.5px", fontFamily: "monospace" }}>
          {row.numero}
        </span>
      ),
    },
    {
      name: "Client",
      selector: (row) => row.client?.nom,
      sortable: true,
      // ✅ Colonne élargie
      grow: 2.5,
      minWidth: "260px",
      // ✅ AFFICHAGE : Nom + phone + phone2 + adresse
      cell: (row) => (
        <div style={{ padding: "4px 0" }}>
          <div style={{ fontWeight: "600", fontSize: "13px", color: "var(--gray-800)" }}>
            {row.client?.nom || "N/A"}
          </div>

          {/* Téléphones */}
          <div style={{ fontSize: "11px", color: "var(--gray-500)", marginTop: "3px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {row.client?.phone && (
              <span>📞 {row.client.phone}</span>
            )}
            {row.client?.phone2 && (
              <span>📞 {row.client.phone2}</span>
            )}
          </div>

          {/* Adresse */}
          {row.client?.adresse && (
            <div
              style={{
                fontSize: "10.5px",
                color: "var(--gray-400)",
                marginTop: "3px",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <FaMapMarkerAlt size={9} /> {row.client.adresse}
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Appareil",
      selector: (row) => `${row.marque} ${row.modele}`,
      sortable: true,
      grow: 1.5,
      minWidth: "180px",
      cell: (row) => (
        <div>
          <div style={{ fontWeight: "600", fontSize: "13px", color: "var(--gray-800)" }}>
            {row.marque} {row.modele}
          </div>
          <div style={{ fontSize: "11px", color: "var(--gray-500)" }}>
            {row.objet?.nom}
          </div>
        </div>
      ),
    },
    {
      name: "Statut",
      selector: (row) => row.status?.label,
      sortable: true,
      center: true,
      width: "170px",
      cell: (row) => {
        const imprevusEnAttente = row.imprevusEnAttente || 0;
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span className="badge-modern" style={{ background: row.status?.color || "var(--gray-500)", color: "white", whiteSpace: "nowrap" }}>
              {row.status?.label || "N/A"}
            </span>
            {imprevusEnAttente > 0 && (
              <span style={{ fontSize: "9.5px", fontWeight: "700", color: "var(--warning)", background: "var(--warning-light)", padding: "2px 6px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "3px" }}>
                ⚠️ {imprevusEnAttente} imprévu{imprevusEnAttente > 1 ? "s" : ""}
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
      width: "100px",
      cell: (row) => (
        <div style={{ textAlign: "right", minWidth: "80px" }}>
          <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--gray-800)" }}>
            {(row.prixTotal || row.prix || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: "10px", color: "var(--gray-500)" }}>DT</div>
        </div>
      ),
    },
    {
      name: "Reste",
      selector: (row) => (row.prix || 0) - (row.acompte || 0),
      sortable: true,
      width: "100px",
      cell: (row) => {
        const reste = (row.prixTotal || row.prix || 0) - (row.acompte || 0);
        return (
          <div style={{ textAlign: "right", minWidth: "80px" }}>
            <div style={{ fontWeight: "700", fontSize: "13px", color: reste > 0 ? "var(--danger)" : "var(--success)" }}>
              {reste.toFixed(2)}
            </div>
            <div style={{ fontSize: "10px", color: "var(--gray-500)" }}>DT</div>
          </div>
        );
      },
    },
    {
      name: "Réparateur",
      selector: (row) => row.reparateur?.firstName,
      sortable: true,
      width: "160px",
      cell: (row) =>
        row.reparateur ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", flexShrink: 0 }}>
              {row.reparateur.firstName?.charAt(0)}
              {row.reparateur.lastName?.charAt(0)}
            </div>
            <span style={{ fontSize: "12.5px", color: "var(--gray-700)" }}>
              {row.reparateur.firstName}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: "12px", color: "var(--gray-400)", fontStyle: "italic" }}>Non assigné</span>
        ),
    },
    {
      name: "Date",
      selector: (row) => row.createdAt,
      sortable: true,
      width: "100px",
      cell: (row) => (
        <span style={{ fontSize: "12px", color: "var(--gray-600)" }}>
          {new Date(row.createdAt).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      name: "Actions",
      center: true,
      width: "160px",
      cell: (row) => (
        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/reparations/${row._id}`); }} title="Voir">
            <FaEye size={12} />
          </button>
          <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleEdit(row); }} title="Modifier">
            <FaEdit size={12} />
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
            <FaPrint size={12} />
          </button>
          <button
            className="btn-icon btn-icon-danger"
            onClick={(e) => { e.stopPropagation(); setSelectedReparation(row); setShowDeleteDialog(true); }}
            title="Supprimer"
          >
            <FaTrash size={12} />
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
      {/* BARRE DE FILTRES UNIFIÉE AVEC ADRESSE */}
      {/* ============================================================ */}
      <div className="card-modern mb-3" style={{ padding: "14px 16px" }}>
        <div className="filters-grid">
          {/* ✅ Recherche */}
          <div style={{ position: "relative", minWidth: 0 }}>
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
              style={{ paddingLeft: "40px", width: "100%", height: "42px" }}
              placeholder="Rechercher : N°, client, téléphone, marque..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          {/* ✅ Filtre Adresse */}
          <div style={{ position: "relative", minWidth: 0 }}>
            <FaMapMarkerAlt
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
              name="adresse"
              className="form-control-modern"
              style={{ paddingLeft: "40px", width: "100%", height: "42px" }}
              placeholder="Filtrer par adresse..."
              value={filters.adresse}
              onChange={handleFilterChange}
            />
          </div>

          {/* ✅ Filtre Statut */}
          <select
            name="status"
            className="form-control-modern"
            style={{ height: "42px" }}
            value={filters.status}
            onChange={handleFilterChange}
            title="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            {statuses.map((s) => (
              <option key={s._id} value={s._id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* ✅ Filtre Réparateur */}
          <select
            name="reparateur"
            className="form-control-modern"
            style={{ height: "42px" }}
            value={filters.reparateur}
            onChange={handleFilterChange}
            title="Filtrer par réparateur"
          >
            <option value="">Tous les réparateurs</option>
            {users
              .filter((u) => u.role === "REPARATEUR")
              .map((u) => (
                <option key={u._id} value={u._id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
          </select>

          {/* ✅ Date début */}
          <input
            type="date"
            name="dateDebut"
            className="form-control-modern"
            style={{ height: "42px" }}
            value={filters.dateDebut}
            onChange={handleFilterChange}
            title="Date de début"
          />

          {/* ✅ Date fin */}
          <input
            type="date"
            name="dateFin"
            className="form-control-modern"
            style={{ height: "42px" }}
            value={filters.dateFin}
            onChange={handleFilterChange}
            title="Date de fin"
          />

          {/* ✅ Reset */}
          {hasActiveFilters && (
            <button
              className="btn-modern btn-modern-outline"
              style={{ height: "42px", padding: "0 16px", justifyContent: "center" }}
              onClick={resetFilters}
              title="Réinitialiser les filtres"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>

        {/* Info résultats */}
        {hasActiveFilters && (
          <div style={{ marginTop: "10px", fontSize: "11.5px", color: "var(--gray-500)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>🔎</span>
            <span>{reparations.length} résultat(s) avec filtres actifs</span>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={reparations}
        loading={loading}
        actions={false}
        searchable={false}
        onRowClicked={(row) => navigate(`/reparations/${row._id}`)}
        emptyMessage="Aucune réparation trouvée"
        paginationPerPage={10}
      />

      <ReparationModal
        show={showModal}
        onClose={() => { setShowModal(false); setEditingReparation(null); }}
        onSuccess={handleSuccess}
        reparation={editingReparation}
      />

      <ConfirmDialog
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer la réparation"
        message={`Êtes-vous sûr de vouloir supprimer la réparation ${selectedReparation?.numero} ?`}
        confirmText="Supprimer"
      />

      <style>{`
        /* ✅ Grille responsive des filtres */
        .filters-grid {
          display: grid;
          grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 1fr auto;
          gap: 10px;
          align-items: center;
        }

        @media (max-width: 1600px) {
          .filters-grid {
            grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 1fr auto;
          }
        }

        @media (max-width: 1400px) {
          .filters-grid {
            grid-template-columns: 1fr 1fr 1fr 1fr;
          }
          .filters-grid > * {
            min-width: 0;
          }
        }

        @media (max-width: 992px) {
          .filters-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 576px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
          .filters-grid > * {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReparationsList;