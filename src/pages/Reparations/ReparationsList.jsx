import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaTimes,
  FaTools, FaCheckCircle, FaSpinner, FaPrint,
  FaMoneyBillWave, FaMapMarkedAlt, FaFilter, FaBoxes,
  FaBriefcase, FaCalendarAlt, FaGift, FaExclamationTriangle,
} from "react-icons/fa";
import {
  getReparations, deleteReparation, deleteManyReparations, updateReparation,
} from "../../api/reparations";
import { getStatuses } from "../../api/statuses";
import { getUsers } from "../../api/users";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DataTable from "../../components/common/DataTable";
import ExportButton from "../../components/common/ExportButton";
import MultiSelect from "../../components/common/MultiSelect";
import { exportReparations } from "../../api/export";
import { useReparationModal } from "../../context/ReparationModalContext";
import { useReparationData } from "../../hooks/useReparationData";
import { useAuth } from "../../context/AuthContext";
// ❌ SUPPRIMÉ : import { ZONES } from "../../constants/zones";
import {
  saveFilters,
  loadFilters,
  clearFilters,
  saveRetardMode,
  loadRetardMode,
} from "../../utils/filterStorage";


// ============================================================
// ✅ Détection de refresh (F5)
// ============================================================
const isPageRefresh = () => {
  try {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0) {
      return navEntries[0].type === "reload";
    }
    if (performance.navigation) {
      return performance.navigation.type === 1;
    }
    return false;
  } catch (e) {
    return false;
  }
};
// ============================================================
// ✅ Constantes
// ============================================================
const DELAI_ALERTE_HEURES = 48;

const STATUTS_TERMINES = [
  "REPARE", "NON REPARE", "SORTIE NON REPARE", "SAV",
  "SORTIE REPARE", "SAV REPARE", "SAV NON REPARE",
  "SAV SORTIE REPARE", "SAV SORTIE NON REPARE",
];

const STATUT_EN_COURS = "EN COURS";
const STATUTS_EDITABLES = ["EN COURS", "REPARE", "NON REPARE"];
const ROLES_REPARATEUR = ["REPARATEUR", "COMMERCIAL"];

const DEFAULT_FILTERS = {
  search: "",
  famille: [],
  categorie: [],
  status: [],
  reparateur: [],
  commercial: [],
  zone: [],
  dateDebut: "",
  dateFin: "",
};

const normalizeLabel = (label) =>
  String(label || "").trim().toUpperCase().replace(/\s+/g, " ");

// ============================================================
// ReparationsList
// ============================================================
const ReparationsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openNewReparation, openEditReparation, registerOnSuccess } =
    useReparationModal();
  // ✅ AJOUT de zones dans la destructuration
  const { categories, familles = [], zones = [] } = useReparationData();

  const { user } = useAuth();
  const canDelete = user?.role === "ADMIN";

  // ============================================================
  // ✅ Mode "retard" : lu depuis sessionStorage au montage
  // ============================================================
  const [isRetardMode, setIsRetardMode] = useState(() => loadRetardMode());

// ✅ Synchronisation URL → state (UNIQUEMENT si l'URL contient ?retard=1)
//    MAIS on ne réactive PAS le mode si le flag de refresh est présent
useEffect(() => {
  const urlHasRetard = searchParams.get("retard") === "1";
  const isRefresh = sessionStorage.getItem("reparations_refresh_flag") === "1";

  // Si c'est un refresh → on ne fait RIEN (le mode a déjà été effacé)
  if (isRefresh) return;

  if (urlHasRetard && !isRetardMode) {
    setIsRetardMode(true);
    saveRetardMode(true);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams]);


// ✅ Si refresh → nettoyer l'URL du paramètre retard
useEffect(() => {
  const isRefresh = sessionStorage.getItem("reparations_refresh_flag") === "1";
  if (isRefresh && searchParams.get("retard") === "1") {
    searchParams.delete("retard");
    setSearchParams(searchParams, { replace: true });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // ============================================================
  // ✅ Désactiver le mode retard
  // ============================================================
  const exitRetardMode = () => {
    setIsRetardMode(false);
    saveRetardMode(false);
    searchParams.delete("retard");
    setSearchParams(searchParams);
  };

  const [reparations, setReparations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);

  const [filters, setFilters] = useState(() => loadFilters(DEFAULT_FILTERS));

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReparation, setSelectedReparation] = useState(null);

  const [showDeleteManyDialog, setShowDeleteManyDialog] = useState(false);
  const [deletingMany, setDeletingMany] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingStatusId, setEditingStatusId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const handleNew = () => openNewReparation();
  const handleEdit = (rep) => openEditReparation(rep);

  // ============================================================
  // ✅ PERSISTANCE
  // ============================================================
  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  // ============================================================
  // CHARGEMENT
  // ============================================================
  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};

      Object.keys(filters).forEach((k) => {
        const v = filters[k];
        if (Array.isArray(v)) {
          if (v.length > 0) params[k] = v.join(",");
        } else if (v && String(v).trim() !== "") {
          params[k] = v;
        }
      });

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

  // ============================================================
  // ✅ HANDLERS
  // ============================================================
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "famille") next.categorie = [];
      return next;
    });
  };

  const handleMultiChange = (name, values) => {
    setFilters((prev) => {
      const next = { ...prev, [name]: values };
      if (name === "famille") next.categorie = [];
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    clearFilters();
    clearSelection();
  };

  const activeCount = useMemo(() => {
    let count = 0;
    Object.values(filters).forEach((v) => {
      if (Array.isArray(v)) count += v.length;
      else if (v && String(v).trim() !== "") count += 1;
    });
    return count;
  }, [filters]);

  const hasActiveFilters = activeCount > 0;

  // ============================================================
  // COMMERCIAUX
  // ============================================================
  const commerciaux = useMemo(
    () =>
      users
        .filter((u) => (u.role || "").toUpperCase().trim() === "COMMERCIAL")
        .sort((a, b) => {
          const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
          const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim();
          return nameA.localeCompare(nameB);
        }),
    [users]
  );

  const reparateurs = useMemo(
    () =>
      users
        .filter((u) =>
          ROLES_REPARATEUR.includes((u.role || "").toUpperCase().trim())
        )
        .sort((a, b) => {
          const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
          const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim();
          return nameA.localeCompare(nameB);
        }),
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

  const editableStatuses = useMemo(() => {
    return statuses.filter((s) =>
      STATUTS_EDITABLES.includes(normalizeLabel(s.label))
    );
  }, [statuses]);

  // ============================================================
  // ✅ OPTIONS pour les MultiSelect
  // ============================================================
  const familleOptions = useMemo(
    () => familles.map((f) => ({ value: f._id, label: f.nom })),
    [familles]
  );

  const categorieOptions = useMemo(() => {
    const familleIds = filters.famille;
    return [...categories]
      .filter((c) => {
        if (!familleIds || familleIds.length === 0) return true;
        const catFamilleId =
          typeof c.famille === "object" && c.famille !== null
            ? c.famille._id
            : c.famille;
        return familleIds.includes(String(catFamilleId));
      })
      .sort(
        (a, b) =>
          (a.ordre ?? 0) - (b.ordre ?? 0) ||
          (a.nom || "").localeCompare(b.nom || "")
      )
      .map((c) => ({ value: c._id, label: c.nom }));
  }, [categories, filters.famille]);

  const statusOptions = useMemo(
    () => statuses.map((s) => ({ value: s._id, label: s.label })),
    [statuses]
  );

  const reparateurOptions = useMemo(
    () =>
      reparateurs.map((u) => ({
        value: u._id,
        label: `${u.firstName} ${u.lastName}${
          u.role === "COMMERCIAL" ? " (Commercial)" : " (Réparateur)"
        }`,
      })),
    [reparateurs]
  );

  const commercialOptions = useMemo(
    () =>
      commerciaux.map((u) => ({
        value: u._id,
        label: `${u.firstName} ${u.lastName}`,
      })),
    [commerciaux]
  );

  // ✅ zoneOptions — depuis l'API (plus de constante ZONES)
  const zoneOptions = useMemo(
    () =>
      [...zones]
        .sort(
          (a, b) =>
            (a.ordre ?? 0) - (b.ordre ?? 0) ||
            (a.nom || "").localeCompare(b.nom || "")
        )
        .map((z) => ({ value: z.nom, label: z.nom })),
    [zones]
  );

  // ============================================================
  // ✅ CHANGEMENT RAPIDE DE STATUT
  // ============================================================
  const handleQuickStatusChange = async (row, newStatusId) => {
    if (!newStatusId || newStatusId === row.status?._id) {
      setEditingStatusId(null);
      return;
    }

    try {
      setUpdatingStatusId(row._id);
      const res = await updateReparation(row._id, { status: newStatusId });
      const updated = res.data;

      setReparations((prev) =>
        prev.map((r) => (r._id === row._id ? { ...r, ...updated } : r))
      );

      setSuccess(`Statut mis à jour : ${updated.status?.label || ""}`);
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors du changement de statut"
      );
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdatingStatusId(null);
      setEditingStatusId(null);
    }
  };

  // ============================================================
  // SUPPRESSION
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
      const label = normalizeLabel(r.status?.label);
      return label === STATUT_EN_COURS;
    }).length;
    const terminees = reparations.filter((r) => {
      const label = normalizeLabel(r.status?.label);
      return STATUTS_TERMINES.includes(label);
    }).length;
    return { total, impayees, enCours, terminees };
  }, [reparations]);

  // ============================================================
  // ✅ FILTRAGE PAR RETARD (mode "retard")
  // ============================================================
  const reparationsFilteredByRetard = useMemo(() => {
    if (!isRetardMode) return reparations;

    const maintenant = new Date();
    return reparations.filter((rep) => {
      const statusLabel = (rep.status?.label || "").toLowerCase();
      const isEnCours =
        statusLabel.includes("en cours") || statusLabel.includes("cours");
      if (!isEnCours) return false;

      const dateReception = rep.dateReception || rep.createdAt;
      if (!dateReception) return false;

      const diffHeures =
        (maintenant - new Date(dateReception)) / (1000 * 60 * 60);
      return diffHeures >= DELAI_ALERTE_HEURES;
    });
  }, [reparations, isRetardMode]);

  // ============================================================
  // ✅ TRI PAR PERTINENCE
  // ============================================================
  const sortedReparations = useMemo(() => {
    const base = reparationsFilteredByRetard;
    const query = (filters.search || "").trim().toLowerCase();
    if (!query) return base;

    const getScore = (r) => {
      const numero = String(r.numero || "").toLowerCase();
      const clientNom = String(r.client?.nom || "").toLowerCase();
      const clientPhone = String(r.client?.phone || "").toLowerCase();
      const clientPhone2 = String(r.client?.phone2 || "").toLowerCase();
      const clientCode = String(r.client?.code || "").toLowerCase();
      const clientCodeFidelite = String(r.client?.codeFidelite || "").toLowerCase();
      const marque = String(r.marque?.nom || "").toLowerCase();
      const modele = String(r.modele?.nom || "").toLowerCase();
      const objet = String(r.objet?.nom || "").toLowerCase();

      if (numero === query) return 10000;
      if (numero.startsWith(query)) return 9500;
      if (numero.includes(query)) return 9000;

      if (clientCodeFidelite === query) return 8500;
      if (clientCodeFidelite.startsWith(query)) return 8000;
      if (clientCodeFidelite.includes(query)) return 7500;

      if (clientPhone === query || clientPhone2 === query) return 7000;
      if (clientPhone.startsWith(query) || clientPhone2.startsWith(query)) return 6500;
      if (clientPhone.includes(query) || clientPhone2.includes(query)) return 6000;

      if (clientNom === query) return 5500;
      if (clientNom.startsWith(query)) return 5000;
      if (clientNom.includes(query)) return 4500;

      if (clientCode.includes(query)) return 4000;

      if (marque === query || modele === query || objet === query) return 3500;
      if (marque.includes(query) || modele.includes(query) || objet.includes(query)) return 3000;

      return 100;
    };

    return [...base]
      .map((r) => ({ r, score: getScore(r) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.r.createdAt) - new Date(a.r.createdAt);
      })
      .map(({ r }) => r);
  }, [reparationsFilteredByRetard, filters.search]);

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
              // ✅ Préserver le mode retard dans l'URL
              const url = isRetardMode ? `/reparations/${row._id}?retard=1` : `/reparations/${row._id}`;
              navigate(url);
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
      cell: (row) => {
        const query = (filters.search || "").trim();
        const numero = String(row.numero || "");

        if (query && numero.toLowerCase().includes(query.toLowerCase())) {
          const idx = numero.toLowerCase().indexOf(query.toLowerCase());
          const before = numero.slice(0, idx);
          const match = numero.slice(idx, idx + query.length);
          const after = numero.slice(idx + query.length);

          return (
            <span
              className="badge-modern badge-modern-primary"
              style={{ fontSize: "10px", fontFamily: "monospace", padding: "3px 7px" }}
            >
              {before}
              <mark
                style={{
                  background: "var(--success)", color: "white",
                  padding: "0 3px", borderRadius: "3px", fontWeight: "800",
                }}
              >
                {match}
              </mark>
              {after}
            </span>
          );
        }

        return (
          <span
            className="badge-modern badge-modern-primary"
            style={{ fontSize: "10px", fontFamily: "monospace", padding: "3px 7px" }}
          >
            {numero}
          </span>
        );
      },
    },
    {
      name: "Client",
      selector: (row) => row.client?.nom,
      sortable: true,
      grow: 2,
      minWidth: "190px",
      cell: (row) => {
        const codeFidelite = row.client?.codeFidelite;
        return (
          <div style={{ padding: "2px 0" }}>
            <div
              style={{
                fontWeight: "600", fontSize: "12.5px", color: "var(--gray-800)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {row.client?.nom || "N/A"}
            </div>
            {row.client?.phone && (
              <div style={{ fontSize: "10.5px", color: "var(--gray-500)", marginTop: "1px" }}>
                📞 {row.client.phone}
              </div>
            )}
            {codeFidelite && (
              <div
                style={{
                  fontSize: "10px", color: "var(--warning)", marginTop: "2px",
                  fontFamily: "monospace", fontWeight: "700",
                  display: "flex", alignItems: "center", gap: "4px",
                }}
              >
                <FaGift size={9} /> {codeFidelite}
              </div>
            )}
            {row.client?.zone && (
              <div
                style={{
                  fontSize: "10px", color: "var(--gray-400)", marginTop: "1px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                <FaMapMarkedAlt size={8} /> {row.client.zone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      name: "Appareil",
      selector: (row) => `${row.marque?.nom || ""} ${row.modele?.nom || ""}`.trim(),
      sortable: true,
      grow: 1.5,
      minWidth: "140px",
      cell: (row) => (
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: "600", fontSize: "12.5px", color: "var(--gray-800)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {row.marque?.nom || "-"} {row.modele?.nom || ""}
          </div>
          <div
            style={{
              fontSize: "10.5px", color: "var(--gray-500)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
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
        const pannes = Array.isArray(row.panneType) ? row.panneType : row.panneType ? [row.panneType] : [];
        if (pannes.length === 0) {
          return <span style={{ fontSize: "11px", color: "var(--gray-400)", fontStyle: "italic" }}>-</span>;
        }
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
            {pannes.slice(0, 2).map((p, i) => (
              <span
                key={i}
                style={{
                  padding: "2px 6px", background: "var(--warning-light)", color: "var(--warning)",
                  borderRadius: "6px", fontSize: "10px", fontWeight: "600",
                  whiteSpace: "nowrap", maxWidth: "100px",
                  overflow: "hidden", textOverflow: "ellipsis",
                }}
              >
                {p}
              </span>
            ))}
            {pannes.length > 2 && (
              <span
                style={{
                  padding: "2px 6px", background: "var(--gray-200)", color: "var(--gray-700)",
                  borderRadius: "6px", fontSize: "10px", fontWeight: "700",
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
      width: "160px",
      cell: (row) => {
        const imprevusEnAttente = row.imprevusEnAttente || 0;
        const currentLabel = normalizeLabel(row.status?.label);
        const isEditable = STATUTS_EDITABLES.includes(currentLabel);
        const isEditing = editingStatusId === row._id;
        const isUpdating = updatingStatusId === row._id;

        if (isEditing && isEditable) {
          return (
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <select
                autoFocus
                value={row.status?._id || ""}
                onChange={(e) => handleQuickStatusChange(row, e.target.value)}
                onBlur={() => { setTimeout(() => setEditingStatusId(null), 150); }}
                disabled={isUpdating}
                style={{
                  fontSize: "11px", padding: "3px 6px", borderRadius: "6px",
                  border: "1px solid var(--primary)", background: "white",
                  cursor: isUpdating ? "wait" : "pointer", minWidth: "110px",
                }}
              >
                {editableStatuses.map((s) => (
                  <option key={s._id} value={s._id}>{s.label}</option>
                ))}
              </select>
              {isUpdating && <FaSpinner size={11} className="spin" style={{ color: "var(--primary)" }} />}
            </div>
          );
        }

        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
            <span
              className="badge-modern"
              onClick={(e) => {
                if (!isEditable || isUpdating) return;
                e.stopPropagation();
                setEditingStatusId(row._id);
              }}
              title={isEditable ? "Cliquer pour changer le statut" : ""}
              style={{
                background: row.status?.color || "var(--gray-500)", color: "white",
                whiteSpace: "nowrap", fontSize: "10px", padding: "3px 8px",
                cursor: isEditable ? "pointer" : "default",
                opacity: isUpdating ? 0.6 : 1,
                transition: "transform 100ms ease, opacity 100ms ease",
                border: isEditable ? "1px dashed rgba(255,255,255,0.5)" : "none",
              }}
              onMouseEnter={(e) => { if (isEditable) e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {row.status?.label || "N/A"}
              {isUpdating && " ⏳"}
            </span>
            {imprevusEnAttente > 0 && (
              <span
                style={{
                  fontSize: "9px", fontWeight: "700", color: "var(--warning)",
                  background: "var(--warning-light)", padding: "1px 5px", borderRadius: "6px",
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
      width: "85px",
      right: true,
      cell: (row) => {
        const reste = (row.prixTotal || row.prix || 0) - (row.acompte || 0);
        return (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontWeight: "700", fontSize: "12.5px",
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
          return <span style={{ fontSize: "11px", color: "var(--gray-400)", fontStyle: "italic" }}>—</span>;
        }
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "24px", height: "24px", borderRadius: "6px",
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "9px", fontWeight: "700", flexShrink: 0,
              }}
            >
              {u.firstName?.charAt(0) || u.username?.charAt(0) || "?"}
              {u.lastName?.charAt(0) || ""}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "11.5px", color: "var(--gray-700)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
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
                width: "24px", height: "24px", borderRadius: "6px",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                color: "white", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "9px", fontWeight: "700", flexShrink: 0,
              }}
            >
              {row.reparateur.firstName?.charAt(0)}
              {row.reparateur.lastName?.charAt(0)}
            </div>
            <span
              style={{
                fontSize: "11.5px", color: "var(--gray-700)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {row.reparateur.firstName}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: "11px", color: "var(--gray-400)", fontStyle: "italic" }}>—</span>
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
                width: "24px", height: "24px", borderRadius: "6px",
                background: "linear-gradient(135deg, var(--warning), #d97706)", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "9px", fontWeight: "700", flexShrink: 0,
              }}
            >
              {row.createdBy.firstName?.charAt(0)}
              {row.createdBy.lastName?.charAt(0)}
            </div>
            <span
              style={{
                fontSize: "11.5px", color: "var(--gray-700)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {row.createdBy.firstName}
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
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--gray-900)", marginBottom: "4px" }}>
            Réparations
          </h1>
          <p style={{ fontSize: "13px", color: "var(--gray-500)", margin: 0 }}>
            {sortedReparations.length} réparation(s) • {stats.enCours} en cours
            {selectedRows.length > 0 && (
              <span style={{ color: "var(--primary)", fontWeight: "600", marginLeft: "8px" }}>
                • {selectedRows.length} sélectionnée(s)
              </span>
            )}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {selectedRows.length > 0 && (
            <button className="btn-modern btn-modern-outline" onClick={clearSelection} title="Désélectionner tout">
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
            label={selectedRows.length > 0 ? `Exporter (${selectedRows.length})` : "Excel"}
          />

          <button className="btn-modern btn-modern-primary" onClick={handleNew}>
            <FaPlus /> Nouvelle réparation
          </button>
        </div>
      </div>

      {success && (
        <div
          style={{
            padding: "12px 16px", background: "var(--success-light)", color: "var(--success)",
            borderRadius: "10px", marginBottom: "20px", fontSize: "13px", fontWeight: "500",
          }}
        >
          ✅ {success}
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "12px 16px", background: "var(--danger-light)", color: "var(--danger)",
            borderRadius: "10px", marginBottom: "20px", fontSize: "13px", fontWeight: "500",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {isRetardMode && (
        <div
          style={{
            padding: "14px 18px",
            background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "16px", flexShrink: 0,
            }}
          >
            <FaExclamationTriangle />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#991b1b" }}>
              🚨 Mode "Réparations en retard"
            </div>
            <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: "600", marginTop: "2px" }}>
              Vous voyez uniquement les réparations en cours depuis plus de 48h.
            </div>
          </div>
          <button
            onClick={exitRetardMode}
            className="btn-modern btn-modern-outline"
            style={{ fontSize: "12px", padding: "8px 14px", borderColor: "#dc2626", color: "#dc2626" }}
          >
            <FaTimes size={10} /> Afficher tout
          </button>
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
                background: "var(--gray-50)", border: "1px solid var(--gray-200)",
                borderRadius: "16px", padding: "18px",
                display: "flex", alignItems: "center", gap: "14px",
              }}
            >
              <div
                style={{
                  width: "46px", height: "46px", borderRadius: "12px",
                  background: stat.bg, color: stat.color, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "11px", fontWeight: "600", color: "var(--gray-500)",
                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px",
                  }}
                >
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

      <div className="card-modern mb-3" style={{ padding: "18px 20px" }}>
        <div className="filters-line filters-line-1">
          <div className="filter-item filter-item-search">
            <div className="filter-search-wrapper">
              <FaSearch className="filter-search-icon" />
              <input
                type="text"
                name="search"
                className="form-control-modern"
                placeholder="Rechercher : reçu, code fidélité, téléphone, client, marque..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="filter-item filter-item-date">
            <label className="filter-label"><FaCalendarAlt size={10} /> Du</label>
            <input
              type="date"
              name="dateDebut"
              className="form-control-modern"
              value={filters.dateDebut}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-item filter-item-date">
            <label className="filter-label"><FaCalendarAlt size={10} /> Au</label>
            <input
              type="date"
              name="dateFin"
              className="form-control-modern"
              value={filters.dateFin}
              onChange={handleFilterChange}
            />
          </div>

          {hasActiveFilters && (
            <div className="filter-item filter-item-clear">
              <button className="btn-modern btn-modern-outline filter-clear-btn" onClick={resetFilters}>
                <FaTimes size={12} /> Effacer {activeCount > 0 && `(${activeCount})`}
              </button>
            </div>
          )}
        </div>

        <div className="filters-line filters-line-2">
          <div className="filter-item">
            <MultiSelect
              label="Famille"
              icon={<FaBoxes size={10} />}
              options={familleOptions}
              value={filters.famille}
              onChange={(v) => handleMultiChange("famille", v)}
              placeholder="Toutes"
            />
          </div>

          <div className="filter-item">
            <MultiSelect
              label="Catégorie"
              icon={<FaBoxes size={10} />}
              options={categorieOptions}
              value={filters.categorie}
              onChange={(v) => handleMultiChange("categorie", v)}
              placeholder={filters.famille.length > 0 ? "Toutes (famille)" : "Toutes"}
            />
          </div>

          <div className="filter-item">
            <MultiSelect
              label="Statut"
              icon={<FaFilter size={10} />}
              options={statusOptions}
              value={filters.status}
              onChange={(v) => handleMultiChange("status", v)}
              placeholder="Tous"
            />
          </div>

          <div className="filter-item">
            <MultiSelect
              label="Réparateur"
              icon={<FaTools size={10} />}
              options={reparateurOptions}
              value={filters.reparateur}
              onChange={(v) => handleMultiChange("reparateur", v)}
              placeholder="Tous"
            />
          </div>

          <div className="filter-item">
            <MultiSelect
              label="Commercial"
              icon={<FaBriefcase size={10} />}
              options={commercialOptions}
              value={filters.commercial}
              onChange={(v) => handleMultiChange("commercial", v)}
              placeholder="Tous"
            />
          </div>

          <div className="filter-item">
            <MultiSelect
              label="Zone"
              icon={<FaMapMarkedAlt size={10} />}
              options={zoneOptions}
              value={filters.zone}
              onChange={(v) => handleMultiChange("zone", v)}
              placeholder="Toutes les zones"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div
            style={{
              marginTop: "12px", fontSize: "11.5px", color: "var(--gray-500)",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            <span>🔎</span>
            <span>{sortedReparations.length} résultat(s) avec filtres actifs</span>
          </div>
        )}
      </div>

      <div style={{ width: "100%", overflow: "hidden" }}>
        <DataTable
          columns={columns}
          data={sortedReparations}
          loading={loading}
          actions={false}
          searchable={false}
          onRowClicked={selectedRows.length > 0 ? undefined : (row) => {
            const url = isRetardMode ? `/reparations/${row._id}?retard=1` : `/reparations/${row._id}`;
            navigate(url);
          }}
          emptyMessage={isRetardMode ? "Aucune réparation en retard 🎉" : "Aucune réparation trouvée"}
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
          message={`Êtes-vous sûr de vouloir supprimer les ${selectedRows.length} réparations sélectionnées ? Cette action est irréversible.\n\nN° : ${selectedRows.slice(0, 5).map((r) => r.numero).join(", ")}${selectedRows.length > 5 ? ` et ${selectedRows.length - 5} autre(s)...` : ""}`}
          confirmText={deletingMany ? "Suppression..." : "Supprimer tout"}
        />
      )}

      <style>{`
        .filters-line { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; width: 100%; }
        .filters-line-1 { margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed var(--gray-200); }
        .filter-item { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .filter-item-search { flex: 1 1 320px; min-width: 220px; }
        .filter-item-date { flex: 0 1 170px; min-width: 140px; }
        .filter-item-clear { flex: 0 0 auto; }
        .filters-line-2 > .filter-item { flex: 1 1 180px; min-width: 150px; }
        .filter-search-wrapper { position: relative; width: 100%; }
        .filter-search-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: var(--gray-400); font-size: 13px; pointer-events: none; z-index: 1;
        }
        .filter-search-wrapper .form-control-modern { padding-left: 40px !important; width: 100%; height: 44px; }
        .filter-item-date .form-control-modern { height: 44px; width: 100%; }
        .filter-clear-btn {
          height: 44px; padding: 0 18px; white-space: nowrap;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .filter-label {
          font-size: 10.5px; font-weight: 700; color: var(--gray-500);
          text-transform: uppercase; letter-spacing: 0.4px;
          display: flex; align-items: center; gap: 5px; padding-left: 2px;
        }
        @media (max-width: 1200px) and (min-width: 993px) {
          .filters-line-2 > .filter-item { flex: 1 1 calc(33.333% - 8px); min-width: 140px; }
        }
        @media (max-width: 992px) {
          .filter-item-search { flex: 1 1 100%; }
          .filter-item-date { flex: 1 1 calc(50% - 6px); }
          .filter-item-clear { flex: 1 1 100%; }
          .filter-clear-btn { width: 100%; justify-content: center; }
          .filters-line-2 > .filter-item { flex: 1 1 calc(50% - 6px); }
        }
        @media (max-width: 576px) {
          .filters-line { gap: 10px; }
          .filter-item-search, .filter-item-date, .filter-item-clear, .filters-line-2 > .filter-item {
            flex: 1 1 100%; min-width: 0;
          }
        }
        .rdt_TableHeadRow { min-height: 42px !important; }
        .rdt_TableRow { min-height: 52px !important; }
        .rdt_TableCell { padding: 8px 10px !important; font-size: 12.5px !important; }
        .rdt_TableCol { padding: 8px 10px !important; }
        .rdt_TableWrapper { width: 100% !important; overflow-x: hidden !important; }
        .rdt_Table { width: 100% !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default ReparationsList;