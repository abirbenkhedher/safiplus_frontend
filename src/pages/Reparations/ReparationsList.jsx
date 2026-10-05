import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaTimes,
  FaTools, FaCheckCircle, FaSpinner, FaPrint,
  FaMoneyBillWave, FaMapMarkedAlt, FaFilter, FaBoxes,
  FaBriefcase,
} from "react-icons/fa";
import {
  getReparations,
  deleteReparation,
  deleteManyReparations,
} from "../../api/reparations";
import { getStatuses } from "../../api/statuses";
import { getUsers } from "../../api/users";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DataTable from "../../components/common/DataTable";
import ExportButton from "../../components/common/ExportButton";
import { exportReparations } from "../../api/export";
import { useReparationModal } from "../../context/ReparationModalContext";
import { useReparationData } from "../../hooks/useReparationData";
import { useAuth } from "../../context/AuthContext";
import { ZONES } from "../../constants/zones";

const STATUTS_TERMINES = [
  "REPARE", "NON REPARE", "SORTIE NON REPARE", "SAV",
  "SORTIE REPARE", "SAV REPARE", "SAV NON REPARE",
  "SAV SORTIE REPARE", "SAV SORTIE NON REPARE",
];

const STATUT_EN_COURS = "EN COURS";

const ReparationsList = () => {
  const navigate = useNavigate();
  const { openNewReparation, openEditReparation, registerOnSuccess } =
    useReparationModal();
  const { categories } = useReparationData();

  const { user } = useAuth();
  const canDelete = user?.role === "ADMIN";

  const [reparations, setReparations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    categorie: "",
    reparateur: "",
    commercial: "",
    zone: "",
    dateDebut: "",
    dateFin: "",
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReparation, setSelectedReparation] = useState(null);

  const [showDeleteManyDialog, setShowDeleteManyDialog] = useState(false);
  const [deletingMany, setDeletingMany] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleNew = () => openNewReparation();
  const handleEdit = (rep) => openEditReparation(rep);

  // ============================================================
  // CHARGEMENT  ← ✅ MODIFIÉ : limit=10000 pour tout récupérer
  // ============================================================
  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach((k) => {
        if (filters[k] && filters[k].trim() !== "") params[k] = filters[k];
      });
      // ✅ AJOUT : récupérer TOUTES les réparations (pas juste 50)
      params.limit = 10000;
      params.page = 1;

      const [repRes, statusesRes, usersRes] = await Promise.all([
        getReparations(params),
        getStatuses(),
        getUsers(),
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

  const clearSelection = () => {
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "",
      categorie: "",
      reparateur: "",
      commercial: "",
      zone: "",
      dateDebut: "",
      dateFin: "",
    });
    clearSelection();
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v && v.trim() !== ""
  );

  const activeCount = Object.values(filters).filter(
    (v) => v && v.trim() !== ""
  ).length;

  const commerciaux = useMemo(
    () => users.filter((u) => u.role === "COMMERCIAL"),
    [users]
  );

  const reparateurs = useMemo(
    () => users.filter((u) => u.role === "REPARATEUR"),
    [users]
  );

  const usersById = useMemo(() => {
    const map = new Map();
    users.forEach((u) => map.set(u._id, u));
    return map;
  }, [users]);

  const getLastModificationInfo = (row) => {
    const mods = row.modifications || [];
    if (mods.length === 0) return { user: null, date: null };

    const filtered = mods.filter((m) => m.field !== "_create");
    const list = filtered.length > 0 ? filtered : mods;

    const last = [...list].sort(
      (a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt)
    )[0];

    if (!last) return { user: null, date: null };

    let user = null;
    if (typeof last.modifiedBy === "string") {
      user = usersById.get(last.modifiedBy) || null;
    } else if (last.modifiedBy && typeof last.modifiedBy === "object") {
      user = last.modifiedBy;
    }

    return { user, date: last.modifiedAt };
  };

  // ============================================================
  // SUPPRESSION SIMPLE
  // ============================================================
  const handleDelete = async () => {
    if (!canDelete) {
      setError("Vous n'avez pas la permission de supprimer");
      setShowDeleteDialog(false);
      return;
    }

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

  const handleDeleteMany = async () => {
    if (!canDelete) {
      setError("Vous n'avez pas la permission de supprimer");
      setShowDeleteManyDialog(false);
      return;
    }

    setDeletingMany(true);
    try {
      const ids = selectedRows.map((r) => r._id);
      const res = await deleteManyReparations(ids);

      setSuccess(
        `${res.deletedCount || 0} réparation(s) supprimée(s) avec succès`
      );
      setShowDeleteManyDialog(false);
      clearSelection();
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la suppression multiple"
      );
      setShowDeleteManyDialog(false);
    } finally {
      setDeletingMany(false);
    }
  };

  const handleExportExcel = async () => {
    if (selectedRows.length > 0) {
      await exportReparations({
        reparations: selectedRows,
        filters: {
          ...filters,
          selection: `${selectedRows.length} réparation(s) sélectionnée(s)`,
        },
      });
      return;
    }

    await exportReparations({
      reparations: reparations,
      filters: filters,
    });
  };

  const handleSelectedRowsChange = ({ selectedRows }) => {
    setSelectedRows(selectedRows);
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
  // COLONNES
  // ============================================================
  const columns = [
    {
      name: "Actions",
      center: true,
      width: "130px",
      cell: (row) => (
        <div style={{ display: "flex", gap: "3px", justifyContent: "center" }}>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reparations/${row._id}`);
            }}
            title="Voir"
          >
            <FaEye size={11} />
          </button>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Modifier"
          >
            <FaEdit size={11} />
          </button>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              const token = localStorage.getItem("accessToken");
              const apiUrl =
                import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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

          {canDelete && (
            <button
              className="btn-icon btn-icon-danger"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReparation(row);
                setShowDeleteDialog(true);
              }}
              title="Supprimer"
            >
              <FaTrash size={11} />
            </button>
          )}
        </div>
      ),
    },
    {
      name: "N°",
      selector: (row) => row.numero,
      sortable: true,
      width: "100px",
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
      minWidth: "170px",
      cell: (row) => (
        <div style={{ padding: "2px 0" }}>
          <div
            style={{
              fontWeight: "600",
              fontSize: "12.5px",
              color: "var(--gray-800)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.client?.nom || "N/A"}
          </div>
          {row.client?.phone && (
            <div
              style={{
                fontSize: "10.5px",
                color: "var(--gray-500)",
                marginTop: "1px",
              }}
            >
              📞 {row.client.phone}
            </div>
          )}
          {row.client?.zone && (
            <div
              style={{
                fontSize: "10px",
                color: "var(--gray-400)",
                marginTop: "1px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <FaMapMarkedAlt size={8} /> {row.client.zone}
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Appareil",
      selector: (row) =>
        `${row.marque?.nom || ""} ${row.modele?.nom || ""}`.trim(),
      sortable: true,
      grow: 1.5,
      minWidth: "140px",
      cell: (row) => (
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: "600",
              fontSize: "12.5px",
              color: "var(--gray-800)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.marque?.nom || "-"} {row.modele?.nom || ""}
          </div>
          <div
            style={{
              fontSize: "10.5px",
              color: "var(--gray-500)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
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
      minWidth: "150px",
      cell: (row) => {
        const pannes = Array.isArray(row.panneType)
          ? row.panneType
          : row.panneType
          ? [row.panneType]
          : [];
        if (pannes.length === 0) {
          return (
            <span
              style={{
                fontSize: "11px",
                color: "var(--gray-400)",
                fontStyle: "italic",
              }}
            >
              -
            </span>
          );
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
      width: "140px",
      cell: (row) => {
        const imprevusEnAttente = row.imprevusEnAttente || 0;
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
            }}
          >
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
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: "700",
                  color: "var(--warning)",
                  background: "var(--warning-light)",
                  padding: "1px 5px",
                  borderRadius: "6px",
                }}
              >
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
      width: "85px",
      right: true,
      cell: (row) => (
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontWeight: "700",
              fontSize: "12.5px",
              color: "var(--gray-800)",
            }}
          >
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
      width: "85px",
      right: true,
      cell: (row) => {
        const reste = (row.prixTotal || row.prix || 0) - (row.acompte || 0);
        return (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontWeight: "700",
                fontSize: "12.5px",
                color: reste > 0 ? "var(--danger)" : "var(--success)",
              }}
            >
              {reste.toFixed(2)}
            </div>
            <div style={{ fontSize: "9.5px", color: "var(--gray-500)" }}>DT</div>
          </div>
        );
      },
    },
    {
      name: "Modifié par",
      selector: (row) => {
        const { user: u } = getLastModificationInfo(row);
        return u?.firstName || "";
      },
      sortable: true,
      width: "140px",
      cell: (row) => {
        const { user: u, date } = getLastModificationInfo(row);

        if (!u) {
          return (
            <span
              style={{
                fontSize: "11px",
                color: "var(--gray-400)",
                fontStyle: "italic",
              }}
            >
              —
            </span>
          );
        }

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: "700",
                flexShrink: 0,
              }}
            >
              {u.firstName?.charAt(0) || u.username?.charAt(0) || "?"}
              {u.lastName?.charAt(0) || ""}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "11.5px",
                  color: "var(--gray-700)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {u.firstName || u.username || "—"}
              </div>
              {date && (
                <div style={{ fontSize: "9.5px", color: "var(--gray-400)" }}>
                  {new Date(date).toLocaleDateString("fr-FR")}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      name: "Réparateur",
      selector: (row) => row.reparateur?.firstName,
      sortable: true,
      width: "120px",
      cell: (row) =>
        row.reparateur ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                background:
                  "linear-gradient(135deg, var(--primary), var(--primary-dark))",
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
            <span
              style={{
                fontSize: "11.5px",
                color: "var(--gray-700)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.reparateur.firstName}
            </span>
          </div>
        ) : (
          <span
            style={{
              fontSize: "11px",
              color: "var(--gray-400)",
              fontStyle: "italic",
            }}
          >
            —
          </span>
        ),
    },
    {
      name: "Commercial",
      selector: (row) => row.createdBy?.firstName,
      sortable: true,
      width: "120px",
      cell: (row) =>
        row.createdBy ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, var(--warning), #d97706)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "9px",
                fontWeight: "700",
                flexShrink: 0,
              }}
            >
              {row.createdBy.firstName?.charAt(0)}
              {row.createdBy.lastName?.charAt(0)}
            </div>
            <span
              style={{
                fontSize: "11.5px",
                color: "var(--gray-700)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.createdBy.firstName}
            </span>
          </div>
        ) : (
          <span
            style={{
              fontSize: "11px",
              color: "var(--gray-400)",
              fontStyle: "italic",
            }}
          >
            —
          </span>
        ),
    },
    {
      name: "Date",
      selector: (row) => row.createdAt,
      sortable: true,
      width: "90px",
      cell: (row) => (
        <span style={{ fontSize: "11px", color: "var(--gray-600)" }}>
          {new Date(row.createdAt).toLocaleDateString("fr-FR")}
        </span>
      ),
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="fade-in-up">
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "var(--gray-900)",
              marginBottom: "4px",
            }}
          >
            Réparations
          </h1>
          <p style={{ fontSize: "13px", color: "var(--gray-500)", margin: 0 }}>
            {reparations.length} réparation(s) • {stats.enCours} en cours
            {selectedRows.length > 0 && (
              <span
                style={{
                  color: "var(--primary)",
                  fontWeight: "600",
                  marginLeft: "8px",
                }}
              >
                • {selectedRows.length} sélectionnée(s)
              </span>
            )}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {selectedRows.length > 0 && (
            <button
              className="btn-modern btn-modern-outline"
              onClick={clearSelection}
              title="Désélectionner tout"
            >
              <FaTimes /> Désélectionner
            </button>
          )}

          {selectedRows.length > 0 && canDelete && (
            <button
              className="btn-modern btn-modern-danger"
              onClick={() => setShowDeleteManyDialog(true)}
              title={`Supprimer les ${selectedRows.length} réparations sélectionnées`}
            >
              <FaTrash /> Supprimer ({selectedRows.length})
            </button>
          )}

          <ExportButton
            onExport={handleExportExcel}
            label={
              selectedRows.length > 0
                ? `Exporter (${selectedRows.length})`
                : "Excel"
            }
          />

          <button className="btn-modern btn-modern-primary" onClick={handleNew}>
            <FaPlus /> Nouvelle réparation
          </button>
        </div>
      </div>

      {success && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--success-light)",
            color: "var(--success)",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          ✅ {success}
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--danger-light)",
            color: "var(--danger)",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div className="row g-3 mb-4">
        {[
          { label: "Total", value: stats.total, icon: <FaTools />, color: "#4361ee", bg: "rgba(67, 97, 238, 0.1)" },
          { label: "Impayées", value: stats.impayees, icon: <FaMoneyBillWave />, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
          { label: "En cours", value: stats.enCours, icon: <FaSpinner />, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
          { label: "Terminées", value: stats.terminees, icon: <FaCheckCircle />, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
        ].map((stat, i) => (
          <div key={i} className="col-6 col-lg-3">
            <div
              style={{
                background: "var(--gray-50)",
                border: "1px solid var(--gray-200)",
                borderRadius: "16px",
                padding: "18px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "12px",
                  background: stat.bg,
                  color: stat.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "var(--gray-500)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "2px",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "800",
                    color: "var(--gray-900)",
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-modern mb-3" style={{ padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            marginBottom: "14px",
            flexWrap: "wrap",
          }}
        >
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
            >
              <FaTimes size={12} /> Effacer {activeCount > 0 && `(${activeCount})`}
            </button>
          )}
        </div>

        <div className="filters-grid">
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
                <option key={c._id} value={c._id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

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
                <option key={s._id} value={s._id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

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
              {reparateurs.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">
              <FaBriefcase size={10} /> Commercial
            </label>
            <select
              name="commercial"
              className="form-control-modern"
              style={{ height: "42px" }}
              value={filters.commercial}
              onChange={handleFilterChange}
            >
              <option value="">Tous</option>
              {commerciaux.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">
              <FaMapMarkedAlt size={10} /> Zone
            </label>
            <select
              name="zone"
              className="form-control-modern"
              style={{ height: "42px" }}
              value={filters.zone}
              onChange={handleFilterChange}
            >
              <option value="">Toutes les zones</option>
              {ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

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

        {hasActiveFilters && (
          <div
            style={{
              marginTop: "12px",
              fontSize: "11.5px",
              color: "var(--gray-500)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🔎</span>
            <span>{reparations.length} résultat(s) avec filtres actifs</span>
          </div>
        )}
      </div>

      <div style={{ width: "100%", overflow: "hidden" }}>
        <DataTable
          columns={columns}
          data={reparations}
          loading={loading}
          actions={false}
          searchable={false}
          onRowClicked={
            selectedRows.length > 0
              ? undefined
              : (row) => navigate(`/reparations/${row._id}`)
          }
          emptyMessage="Aucune réparation trouvée"
          paginationPerPage={10}
          dense={true}
          selectableRows={true}
          onSelectedRowsChange={handleSelectedRowsChange}
          clearSelectedRows={toggleCleared}
        />
      </div>

      {canDelete && (
        <ConfirmDialog
          show={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Supprimer la réparation"
          message={`Êtes-vous sûr de vouloir supprimer la réparation ${selectedReparation?.numero} ?`}
          confirmText="Supprimer"
        />
      )}

      {canDelete && (
        <ConfirmDialog
          show={showDeleteManyDialog}
          onClose={() => setShowDeleteManyDialog(false)}
          onConfirm={handleDeleteMany}
          title={`Supprimer ${selectedRows.length} réparation(s)`}
          message={`Êtes-vous sûr de vouloir supprimer les ${selectedRows.length} réparations sélectionnées ? Cette action est irréversible.\n\nN° : ${selectedRows
            .slice(0, 5)
            .map((r) => r.numero)
            .join(", ")}${
            selectedRows.length > 5
              ? ` et ${selectedRows.length - 5} autre(s)...`
              : ""
          }`}
          confirmText={deletingMany ? "Suppression..." : "Supprimer tout"}
        />
      )}

      <style>{`
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
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

        @media (max-width: 1500px) {
          .filters-grid { grid-template-columns: repeat(4, 1fr); }
        }

        @media (max-width: 992px) {
          .filters-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 576px) {
          .filters-grid { grid-template-columns: 1fr; }
          .filters-grid > * { width: 100% !important; }
        }

        .rdt_TableHeadRow { min-height: 42px !important; }
        .rdt_TableRow { min-height: 52px !important; }
        .rdt_TableCell { padding: 8px 10px !important; font-size: 12.5px !important; }
        .rdt_TableCol { padding: 8px 10px !important; }

        .rdt_TableWrapper { width: 100% !important; overflow-x: hidden !important; }
        .rdt_Table { width: 100% !important; }
      `}</style>
    </div>
  );
};

export default ReparationsList;