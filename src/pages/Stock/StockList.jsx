import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { withBoutiqueColumn } from "../../components/common/boutiqueColumn";
import {
  FaPlus, FaSearch, FaTimes, FaTrash, FaFilter,
  FaBoxes, FaTag, FaMobileAlt, FaTrademark, FaExclamationTriangle,
  FaTimesCircle, FaPlusCircle, FaMinusCircle,
  FaCheck, FaHistory,
} from "react-icons/fa";
import {
  getStock, getStockStats, getStockReferentiels,
  incrementStock, setStockQuantite, deleteStock,
} from "../../api/stock";
import DataTable from "../../components/common/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import MultiSelect from "../../components/common/MultiSelect";
import StockForm from "./StockForm";
import StockHistory from "./StockHistory";
import { blockInGlobalView } from "../../utils/boutiqueStorage";

// ============================================================
// ✅ Filtres par défaut (tous des tableaux)
// ============================================================
const DEFAULT_FILTERS = {
  search: "",
  categorie: [],
  objet: [],
  typeArticle: [],
  marque: [],
  modele: [],
  etat: [],
};

const StockList = () => {
  const { user, hasPermission, isAllBoutiques, boutiqueOf } = useAuth();
  const canDelete = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);
  // ✅ "stock:read" = consultation seule (pas d'ajout / modification)
  const canWrite = hasPermission('stock');

  const [stocks, setStocks] = useState([]);
  const [stats, setStats] = useState(null);
  const [referentiels, setReferentiels] = useState({
    typesArticle: [],
    categories: [],
    objets: [],
    marques: [],
    modeles: [],
  });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [showDeleteMany, setShowDeleteMany] = useState(false);
  const [deletingMany, setDeletingMany] = useState(false);
  const [historyFor, setHistoryFor] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [editQte, setEditQte] = useState({});

  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false);

  // ============================================================
  // Chargement
  // ============================================================
  const load = async () => {
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

      const [res, statsRes] = await Promise.all([
        getStock(params),
        getStockStats(),
      ]);
      setStocks(res.data.data);
      setStats(statsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getStockReferentiels();
        setReferentiels(res.data.data);
      } catch (err) {
        console.error("Erreur chargement référentiels:", err);
      }
    })();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [filters]);

  // ============================================================
  // Handlers
  // ============================================================
  const handleIncrement = async (id, delta) => {
    try {
      setBusyId(id);
      await incrementStock(id, delta);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Erreur");
    } finally {
      setBusyId(null);
    }
  };

  const handleSetQuantite = async (id) => {
    const val = editQte[id];
    if (val === undefined || val === "") return;
    try {
      setBusyId(id);
      await setStockQuantite(id, Number(val));
      setEditQte((prev) => {
        const c = { ...prev };
        delete c[id];
        return c;
      });
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Erreur");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || !toDelete) return;
    try {
      await deleteStock(toDelete._id);
      setShowDelete(false);
      setToDelete(null);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Erreur");
    }
  };

  const handleDeleteMany = async () => {
    if (!canDelete || selectedRows.length === 0) return;
    try {
      setDeletingMany(true);
      for (const row of selectedRows) {
        await deleteStock(row._id);
      }
      setShowDeleteMany(false);
      clearSelection();
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Erreur");
    } finally {
      setDeletingMany(false);
    }
  };

  const clearSelection = () => {
    setSelectedRows([]);
    setToggleCleared((prev) => !prev);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiChange = (name, values) => {
    setFilters((prev) => {
      const next = { ...prev, [name]: values };
      if (name === "objet") {
        next.marque = [];
        next.modele = [];
      }
      if (name === "marque") {
        next.modele = [];
      }
      return next;
    });
  };

  // ============================================================
  // Filtres cascade
  // ============================================================
  const marquesFiltrees = useMemo(() => {
    if (filters.objet.length === 0) return referentiels.marques;
    return referentiels.marques.filter((m) => {
      const objetId = typeof m.objet === "object" && m.objet !== null ? m.objet._id : m.objet;
      return !objetId || filters.objet.includes(String(objetId));
    });
  }, [referentiels.marques, filters.objet]);

  const modelesFiltres = useMemo(() => {
    if (filters.marque.length === 0) return referentiels.modeles;
    return referentiels.modeles.filter((m) => {
      const marqueId = typeof m.marque === "object" && m.marque !== null ? m.marque._id : m.marque;
      return !marqueId || filters.marque.includes(String(marqueId));
    });
  }, [referentiels.modeles, filters.marque]);

  // ============================================================
  // Options MultiSelect
  // ============================================================
  const categorieOptions = useMemo(
    () =>
      [...referentiels.categories]
        .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""))
        .map((c) => ({ value: c._id, label: c.nom })),
    [referentiels.categories]
  );

  const objetOptions = useMemo(
    () =>
      [...referentiels.objets]
        .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""))
        .map((o) => ({ value: o._id, label: o.nom })),
    [referentiels.objets]
  );

  const typeArticleOptions = useMemo(
    () =>
      [...referentiels.typesArticle]
        .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""))
        .map((t) => ({ value: t._id, label: t.nom })),
    [referentiels.typesArticle]
  );

  const marqueOptions = useMemo(
    () =>
      [...marquesFiltrees]
        .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""))
        .map((m) => ({ value: m._id, label: m.nom })),
    [marquesFiltrees]
  );

  const modeleOptions = useMemo(
    () =>
      [...modelesFiltres]
        .sort((a, b) => (a.nom || "").localeCompare(b.nom || ""))
        .map((m) => ({ value: m._id, label: m.nom })),
    [modelesFiltres]
  );

  const etatOptions = useMemo(
    () => [
      { value: "rupture", label: "🔴 Rupture" },
      { value: "faible", label: "🟡 Faible" },
    ],
    []
  );

  // ============================================================
  // Badge état
  // ============================================================
  const etatBadge = (etat, qte, seuil) => {
    const map = {
      rupture: { bg: "#fee2e2", color: "#991b1b", label: `🔴 Rupture` },
      faible: { bg: "#fef3c7", color: "#92400e", label: `🟡 Faible (${qte}/${seuil})` },
      ok: { bg: "#d1fae5", color: "#065f46", label: `🟢 ${qte}` },
    };
    const m = map[etat] || map.ok;
    return (
      <span
        style={{
          padding: "3px 10px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "700",
          background: m.bg,
          color: m.color,
          display: "inline-block",
          whiteSpace: "nowrap",
        }}
      >
        {m.label}
      </span>
    );
  };

  // ============================================================
  // ✅ Colonnes DataTable — Sans colonne Historique
  // ============================================================
  const columns = useMemo(
    () => [
      {
        name: "Catégorie",
        selector: (row) => row.categorie?.nom || "",
        sortable: true,
        minWidth: "120px",
        cell: (row) => (
          <span style={{ fontWeight: "600", color: "var(--gray-800)", fontSize: "13px" }}>
            {row.categorie?.nom || "—"}
          </span>
        ),
      },
      {
        name: "Objet",
        selector: (row) => row.objet?.nom || "",
        sortable: true,
        minWidth: "110px",
        cell: (row) => (
          <span style={{ fontSize: "12.5px", color: "var(--gray-600)" }}>
            {row.objet?.nom || "—"}
          </span>
        ),
      },
      {
        name: "Type d'article",
        selector: (row) => row.typeArticle?.nom || "",
        sortable: true,
        minWidth: "140px",
        cell: (row) => (
          <span
            style={{
              display: "inline-block",
              padding: "3px 10px",
              background: "var(--primary-light)",
              color: "var(--primary)",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              whiteSpace: "nowrap",
            }}
          >
            {row.typeArticle?.nom || "—"}
          </span>
        ),
      },
      {
        name: "Marque",
        selector: (row) => row.marque?.nom || "",
        sortable: true,
        minWidth: "100px",
        cell: (row) => (
          <span style={{ fontSize: "12.5px", color: "var(--gray-600)" }}>
            {row.marque?.nom || "—"}
          </span>
        ),
      },
      {
        name: "Modèle",
        selector: (row) => row.modele?.nom || "",
        sortable: true,
        minWidth: "110px",
        cell: (row) => (
          <span style={{ fontSize: "12.5px", color: "var(--gray-600)" }}>
            {row.modele?.nom || "—"}
          </span>
        ),
      },
      {
        name: "Prix réparation",
        selector: (row) => row.prixIndicatif || 0,
        sortable: true,
        right: true,
        width: "130px",
        cell: (row) => {
          const prix = Number(row.prixIndicatif) || 0;
          if (prix <= 0) {
            return (
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--gray-400)",
                  fontStyle: "italic",
                }}
              >
                —
              </span>
            );
          }
          return (
            <span
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#10b981",
              }}
            >
              {new Intl.NumberFormat("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(prix)}{" "}
              <span style={{ fontSize: "10.5px", fontWeight: "600", color: "var(--gray-500)" }}>
                DT
              </span>
            </span>
          );
        },
      },
      {
        name: "Stock",
        selector: (row) => row.quantite,
        sortable: true,
        center: true,
        width: "130px",
        cell: (row) => etatBadge(row.etat, row.quantite, row.seuilAlerte),
      },
      {
        name: "Ajuster",
        center: true,
        minWidth: "200px",
        cell: (row) => {
          const isBusy = busyId === row._id;
          const editVal = editQte[row._id];
          const hasEdit = editVal !== undefined && editVal !== "";
          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleIncrement(row._id, -1);
                }}
                disabled={!canWrite || isBusy || row.quantite === 0}
                title="Retirer 1"
                style={btnIncrSmall}
              >
                <FaMinusCircle />
              </button>

              <input
                type="number"
                min="0"
                value={hasEdit ? editVal : row.quantite}
                onChange={(e) =>
                  setEditQte({ ...editQte, [row._id]: e.target.value })
                }
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSetQuantite(row._id);
                  if (e.key === "Escape") {
                    setEditQte((prev) => {
                      const c = { ...prev };
                      delete c[row._id];
                      return c;
                    });
                  }
                }}
                disabled={!canWrite || isBusy}
                style={{
                  width: "60px",
                  padding: "5px 6px",
                  textAlign: "center",
                  fontSize: "13px",
                  fontWeight: "700",
                  border: hasEdit
                    ? "2px solid var(--primary)"
                    : "1px solid var(--gray-300)",
                  borderRadius: "6px",
                  outline: "none",
                  background: hasEdit ? "var(--primary-light)" : "white",
                }}
              />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleIncrement(row._id, 1);
                }}
                disabled={!canWrite || isBusy}
                title="Ajouter 1"
                style={{ ...btnIncrSmall, color: "var(--success)" }}
              >
                <FaPlusCircle />
              </button>

              {hasEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetQuantite(row._id);
                  }}
                  disabled={isBusy}
                  title="Valider la quantité"
                  style={{
                    width: "26px",
                    height: "26px",
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                  }}
                >
                  <FaCheck />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line
    [busyId, editQte, canDelete]
  );

  const handleSelectedRowsChange = ({ selectedRows: rows }) => {
    setSelectedRows(rows);
  };

  // ============================================================
  // Rendu
  // ============================================================
  return (
    <div className="fade-in-up">
      {/* EN-TÊTE */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--gray-900)", marginBottom: "4px" }}>
            Stock
          </h1>
          <p style={{ fontSize: "13px", color: "var(--gray-500)", margin: 0 }}>
            {stocks.length} ligne{stocks.length > 1 ? "s" : ""} affichée{stocks.length > 1 ? "s" : ""}
            {selectedRows.length > 0 && (
              <span style={{ color: "var(--primary)", fontWeight: "600", marginLeft: "8px" }}>
                • {selectedRows.length} sélectionné(s)
              </span>
            )}
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          {selectedRows.length > 0 && (
            <button
              className="btn-modern btn-modern-outline"
              onClick={clearSelection}
            >
              <FaTimes /> Désélectionner
            </button>
          )}

          {selectedRows.length > 0 && canDelete && (
            <button
              className="btn-modern btn-modern-danger"
              onClick={() => setShowDeleteMany(true)}
              title={`Supprimer les ${selectedRows.length} lignes sélectionnées`}
            >
              <FaTrash /> Supprimer ({selectedRows.length})
            </button>
          )}

          {canWrite && (
            <button
              className="btn-modern btn-modern-primary"
              onClick={() => {
                setEditing(null);
                if (!blockInGlobalView()) setShowForm(true);
              }}
            >
              <FaPlus /> Nouvelle ligne
            </button>
          )}
        </div>
      </div>

      {/* KPI — 3 cartes */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-4">
            <KpiCard
              icon={<FaBoxes />}
              label="Lignes"
              value={stats.total}
              color="#4361ee"
              bg="rgba(67,97,238,0.1)"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <KpiCard
              icon={<FaExclamationTriangle />}
              label="En alerte"
              value={stats.enAlerte}
              color="#f59e0b"
              bg="rgba(245,158,11,0.1)"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <KpiCard
              icon={<FaTimesCircle />}
              label="Rupture"
              value={stats.rupture}
              color="#ef4444"
              bg="rgba(239,68,68,0.1)"
            />
          </div>
        </div>
      )}

      {/* FILTRES */}
      <div className="card-modern mb-3" style={{ padding: "18px 20px" }}>
        <div className="filters-line filters-line-1">
          <div className="filter-item filter-item-search">
            <div className="filter-search-wrapper">
              <FaSearch className="filter-search-icon" />
              <input
                type="text"
                name="search"
                className="form-control-modern"
                placeholder="Rechercher : catégorie, marque, modèle, type d'article..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="filter-item filter-item-clear">
              <button
                className="btn-modern btn-modern-outline filter-clear-btn"
                onClick={resetFilters}
              >
                <FaTimes size={12} /> Effacer{activeCount > 0 && ` (${activeCount})`}
              </button>
            </div>
          )}
        </div>

        <div className="filters-line filters-line-2">
          <div className="filter-item">
            <MultiSelect
              label="Catégorie"
              icon={<FaTag size={10} />}
              options={categorieOptions}
              value={filters.categorie}
              onChange={(v) => handleMultiChange("categorie", v)}
              placeholder="Toutes"
            />
          </div>

          <div className="filter-item">
            <MultiSelect
              label="Objet"
              icon={<FaMobileAlt size={10} />}
              options={objetOptions}
              value={filters.objet}
              onChange={(v) => handleMultiChange("objet", v)}
              placeholder="Tous"
            />
          </div>

          <div className="filter-item">
            <MultiSelect
              label="Type d'article"
              icon={<FaFilter size={10} />}
              options={typeArticleOptions}
              value={filters.typeArticle}
              onChange={(v) => handleMultiChange("typeArticle", v)}
              placeholder="Tous"
            />
          </div>

          <div className="filter-item">
            <MultiSelect
              label="Marque"
              icon={<FaTrademark size={10} />}
              options={marqueOptions}
              value={filters.marque}
              onChange={(v) => handleMultiChange("marque", v)}
              placeholder="Toutes"
            />
          </div>

          <div className="filter-item">
            <MultiSelect
              label="Modèle"
              icon={<FaMobileAlt size={10} />}
              options={modeleOptions}
              value={filters.modele}
              onChange={(v) => handleMultiChange("modele", v)}
              placeholder="Tous"
            />
          </div>

          <div className="filter-item">
            <MultiSelect
              label="État"
              icon={<FaExclamationTriangle size={10} />}
              options={etatOptions}
              value={filters.etat}
              onChange={(v) => handleMultiChange("etat", v)}
              placeholder="Tous"
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
            <span>{stocks.length} résultat(s) avec filtres actifs</span>
          </div>
        )}
      </div>

      {/* ✅ DATATABLE — avec icône FaHistory pour "Voir" */}
      <div style={{ width: "100%", overflow: "hidden" }}>
        <DataTable
          columns={withBoutiqueColumn(columns, isAllBoutiques, boutiqueOf)}
          data={stocks}
          loading={loading}
          searchable={false}
          emptyMessage="Aucune ligne de stock"
          selectableRows={true}
          onSelectedRowsChange={handleSelectedRowsChange}
          clearSelectedRows={toggleCleared}
          viewIcon={<FaHistory size={12} />}
          viewTitle="Historique"
          onView={(row) => setHistoryFor(row)}
          onEdit={
            canWrite
              ? (row) => {
                  setEditing(row);
                  if (!blockInGlobalView()) setShowForm(true);
                }
              : undefined
          }
          onDelete={
            canDelete
              ? (row) => {
                  setToDelete(row);
                  setShowDelete(true);
                }
              : undefined
          }
        />
      </div>

      {/* MODALES */}
      {showForm && (
        <StockForm
          stock={editing}
          referentiels={referentiels}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      {historyFor && (
        <StockHistory stock={historyFor} onClose={() => setHistoryFor(null)} />
      )}

      {canDelete && showDelete && toDelete && (
        <ConfirmDialog
          show={showDelete}
          onClose={() => {
            setShowDelete(false);
            setToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Supprimer la ligne de stock ?"
          message={`Voulez-vous supprimer "${toDelete.typeArticle?.nom || ""} ${toDelete.marque?.nom || ""} ${toDelete.modele?.nom || ""}" (qté: ${toDelete.quantite}) ? Cette action est irréversible.`}
          confirmText="Supprimer"
        />
      )}

      {canDelete && showDeleteMany && (
        <ConfirmDialog
          show={showDeleteMany}
          onClose={() => setShowDeleteMany(false)}
          onConfirm={handleDeleteMany}
          title={`Supprimer ${selectedRows.length} ligne(s)`}
          message={`Êtes-vous sûr de vouloir supprimer les ${selectedRows.length} lignes sélectionnées ?\n\nCette action est irréversible.`}
          confirmText={deletingMany ? "Suppression..." : "Supprimer tout"}
        />
      )}

      {/* STYLES */}
      <style>{`
        .filters-line {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: flex-end;
          width: 100%;
        }
        .filters-line-1 {
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px dashed var(--gray-200);
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .filter-item-search {
          flex: 1 1 320px;
          min-width: 220px;
        }
        .filter-item-clear {
          flex: 0 0 auto;
        }
        .filters-line-2 > .filter-item {
          flex: 1 1 180px;
          min-width: 150px;
        }

        .filter-search-wrapper {
          position: relative;
          width: 100%;
        }
        .filter-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
          font-size: 13px;
          pointer-events: none;
          z-index: 1;
        }
        .filter-search-wrapper .form-control-modern {
          padding-left: 40px !important;
          width: 100%;
          height: 44px;
        }

        .filter-clear-btn {
          height: 44px;
          padding: 0 18px;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        @media (max-width: 1200px) and (min-width: 993px) {
          .filters-line-2 > .filter-item {
            flex: 1 1 calc(33.333% - 8px);
            min-width: 140px;
          }
        }
        @media (max-width: 992px) {
          .filter-item-search {
            flex: 1 1 100%;
          }
          .filter-item-clear {
            flex: 1 1 100%;
          }
          .filter-clear-btn {
            width: 100%;
            justify-content: center;
          }
          .filters-line-2 > .filter-item {
            flex: 1 1 calc(50% - 6px);
          }
        }
        @media (max-width: 576px) {
          .filters-line {
            gap: 10px;
          }
          .filter-item-search,
          .filter-item-clear,
          .filters-line-2 > .filter-item {
            flex: 1 1 100%;
            min-width: 0;
          }
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

// ============================================================
// Sous-composants & styles
// ============================================================
const KpiCard = ({ icon, label, value, color, bg, isText }) => (
  <div
    style={{
      background: "var(--gray-50)",
      border: "1px solid var(--gray-200)",
      borderRadius: "16px",
      padding: "18px",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      height: "100%",
    }}
  >
    <div
      style={{
        width: "46px",
        height: "46px",
        borderRadius: "12px",
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
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
        {label}
      </div>
      <div
        style={{
          fontSize: isText ? "16px" : "22px",
          fontWeight: "800",
          color: "var(--gray-900)",
          lineHeight: 1.1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

const btnIncrSmall = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  color: "var(--danger)",
  padding: "2px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 100ms ease",
};

export default StockList;