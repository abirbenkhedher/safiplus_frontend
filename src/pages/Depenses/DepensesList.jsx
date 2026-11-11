import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { withBoutiqueColumn } from "../../components/common/boutiqueColumn";
import { blockInGlobalView } from "../../utils/boutiqueStorage";
import {
  FaPlus, FaSearch, FaTimes, FaMoneyBillWave,
  FaTools, FaTruck, FaFileInvoice, FaCalendarAlt,
  FaCreditCard, FaStickyNote, FaUser, FaBuilding,
  FaEye, FaEdit, FaTrash,
} from "react-icons/fa";
import { getDepenses, getDepensesStats, deleteDepense } from "../../api/depenses";
import DataTable from "../../components/common/DataTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DepenseForm from "./DepenseForm";

const DepensesList = () => {
  // ✅ Récupérer l'utilisateur connecté
  const { user, isAllBoutiques, boutiqueOf } = useAuth();

  // ✅ Seul ADMIN peut supprimer
  const canDelete = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  const [depenses, setDepenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    type: "",
    dateDebut: "",
    dateFin: "",
    search: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  // ✅ ConfirmDialog suppression
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      // Pagination côté navigateur : on charge toutes les dépenses filtrées
      // (sinon l'option « Tous » n'afficherait que les 100 premières)
      params.limit = "all";

      const [res, statsRes] = await Promise.all([
        getDepenses(params),
        getDepensesStats({
          dateDebut: filters.dateDebut,
          dateFin: filters.dateFin,
          portee: filters.portee || undefined,
        }),
      ]);

      setDepenses(res.data.data || []);
      setStats(statsRes.data.data);
    } catch (err) {
      console.error("Erreur chargement dépenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [filters]);

  const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n || 0);

  // ✅ Suppression via ConfirmDialog (sécurisée)
  const handleDelete = async () => {
    if (!canDelete || !toDelete) return;

    try {
      await deleteDepense(toDelete._id);
      setShowDeleteDialog(false);
      setToDelete(null);
      load();
    } catch (err) {
      console.error("Erreur suppression dépense:", err);
      setShowDeleteDialog(false);
      setToDelete(null);
    }
  };

  // ✅ Filtres actifs ?
  const hasActiveFilters = Object.values(filters).some((v) => v && v !== "");

  const resetFilters = () =>
    setFilters({ type: "", dateDebut: "", dateFin: "", search: "", portee: "" });

  // ============================================================
  // ✅ Colonnes DataTable
  // ============================================================
  const columns = useMemo(
    () => [
         {
        
      },
      {
        name: "N°",
        selector: (row) => row.numero,
        sortable: true,
        width: "140px",
        cell: (row) => (
          <span
            className="badge-modern badge-modern-primary"
            style={{ fontSize: "10.5px", fontFamily: "monospace" }}
          >
            {row.numero}
          </span>
        ),
      },
      {
        name: "Date",
        selector: (row) => row.dateDepense,
        sortable: true,
        width: "110px",
        cell: (row) => (
          <span style={{ fontSize: "12.5px", color: "var(--gray-600)" }}>
            {new Date(row.dateDepense).toLocaleDateString("fr-FR")}
          </span>
        ),
      },
      {
        name: "Type",
        selector: (row) => row.type,
        sortable: true,
        width: "150px",
        cell: (row) =>
          row.type === "ACHAT" ? (
            <span className="badge-modern badge-modern-success" style={{ fontSize: "10.5px" }}>
              🧾 Achat{row.statut && row.statut !== "validee" ? ` (${row.statut})` : ""}
            </span>
          ) : row.type === "REPARATION" ? (
            <span
              className="badge-modern badge-modern-primary"
              style={{ fontSize: "10.5px", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <FaTools size={9} /> Réparation
            </span>
          ) : (
            <span
              className="badge-modern badge-modern-warning"
              style={{ fontSize: "10.5px", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <FaTruck size={9} /> Diverse
            </span>
          ),
      },
      {
        name: "Détails",
        grow: 2,
        minWidth: "220px",
        cell: (row) => (
          <div style={{ fontSize: "12px", color: "var(--gray-600)" }}>
            {row.type === "DIVERSE" && row.categorieDiverse && (
              <div style={{ fontWeight: "600", color: "var(--gray-700)" }}>
                {row.categorieDiverse}
                {row.motifDiverse && (
                  <span style={{ color: "var(--gray-500)", fontWeight: "400" }}>
                    {" "}
                    — {row.motifDiverse}
                  </span>
                )}
              </div>
            )}
            {row.fournisseur && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                <FaBuilding size={9} style={{ color: "var(--gray-400)" }} />
                {row.fournisseur}
              </div>
            )}
            {row.factureNumero && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px", color: "var(--gray-500)" }}>
                <FaFileInvoice size={9} style={{ color: "var(--gray-400)" }} />
                {row.factureNumero}
              </div>
            )}
          </div>
        ),
      },
      {
        name: "Montant",
        selector: (row) => row.montant,
        sortable: true,
        right: true,
        width: "130px",
        cell: (row) => (
          <strong style={{ color: "var(--danger)", fontSize: "13.5px" }}>
            {fmt(row.montant)} DT
          </strong>
        ),
      },
    ],
    // eslint-disable-next-line
    []
  );

  return (
    <div className="fade-in-up">
      {/* ============================================ */}
      {/* EN-TÊTE */}
      {/* ============================================ */}
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
            Dépenses
          </h1>
          <p style={{ fontSize: "13px", color: "var(--gray-500)", margin: 0 }}>
            {depenses.length} dépense{depenses.length > 1 ? "s" : ""} affichée
            {depenses.length > 1 ? "s" : ""}
          </p>
        </div>

        <button
          className="btn-modern btn-modern-primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <FaPlus /> Nouvelle dépense
        </button>
      </div>

      {/* ============================================ */}
      {/* KPI */}
      {/* ============================================ */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-4">
            <KpiCard
              icon={<FaMoneyBillWave />}
              label="Total dépenses"
              value={`${fmt(stats.total)} DT`}
              subtitle={`${stats.count} dépense${stats.count > 1 ? "s" : ""}`}
              color="#ef4444"
              bg="rgba(239, 68, 68, 0.1)"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <KpiCard
              icon={<FaTools />}
              label="Réparation"
              value={`${fmt(stats.reparation.total)} DT`}
              subtitle={`${stats.reparation.count} facture${
                stats.reparation.count > 1 ? "s" : ""
              }`}
              color="#4361ee"
              bg="rgba(67, 97, 238, 0.1)"
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <KpiCard
              icon={<FaTruck />}
              label="Diverse"
              value={`${fmt(stats.diverse.total)} DT`}
              subtitle={`${stats.diverse.count} dépense${
                stats.diverse.count > 1 ? "s" : ""
              }`}
              color="#f59e0b"
              bg="rgba(245, 158, 11, 0.1)"
            />
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* FILTRES */}
      {/* ============================================ */}
      <div className="card-modern mb-3" style={{ padding: "14px 16px" }}>
        <div className="depenses-filters-grid">
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
              className="form-control-modern"
              style={{ paddingLeft: "40px", width: "100%", height: "42px" }}
              placeholder="Rechercher n° / fournisseur / facture..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          <select
            className="form-control-modern"
            style={{ height: "42px" }}
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">Tous les types</option>
            <option value="REPARATION">🔧 Réparation</option>
            <option value="DIVERSE">🚚 Diverse</option>
            <option value="ACHAT">🧾 Facture d'achat</option>
          </select>

          {/* ✅ Vue globale : dépenses administratives / des boutiques */}
          {isAllBoutiques && (
            <select
              className="form-control-modern"
              style={{ height: "42px" }}
              value={filters.portee || ""}
              onChange={(e) => setFilters({ ...filters, portee: e.target.value })}
            >
              <option value="">Toutes les dépenses</option>
              <option value="administrative">🏢 Administratives (globales)</option>
              <option value="boutiques">🏪 Des boutiques</option>
            </select>
          )}

          <input
            type="date"
            className="form-control-modern"
            style={{ height: "42px" }}
            value={filters.dateDebut}
            onChange={(e) =>
              setFilters({ ...filters, dateDebut: e.target.value })
            }
            placeholder="Du"
          />

          <input
            type="date"
            className="form-control-modern"
            style={{ height: "42px" }}
            value={filters.dateFin}
            onChange={(e) =>
              setFilters({ ...filters, dateFin: e.target.value })
            }
            placeholder="Au"
          />

          {hasActiveFilters && (
            <button
              className="btn-modern btn-modern-outline"
              style={{
                height: "42px",
                padding: "0 16px",
                justifyContent: "center",
              }}
              onClick={resetFilters}
              title="Réinitialiser les filtres"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div
            style={{
              marginTop: "10px",
              fontSize: "11.5px",
              color: "var(--gray-500)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🔎</span>
            <span>
              {depenses.length} résultat(s) avec filtres actifs
            </span>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* DATATABLE */}
      {/* ============================================ */}
      <DataTable
        columns={withBoutiqueColumn(columns, isAllBoutiques, boutiqueOf, "Administrative")}
        data={depenses}
        loading={loading}
        onView={(row) => setViewing(row)}
        onEdit={(row) => {
          // ✅ Vue globale : seules les dépenses administratives sont modifiables
          if (row.boutique && blockInGlobalView()) return;
          // ✅ Factures d'achat : écran dédié (lignes, validation, annulation)
          if (row.type === "ACHAT") { window.location.assign("/achats"); return; }
          setEditing(row);
          setShowForm(true);
        }}
        // ✅ Bouton supprimer uniquement si ADMIN
        onDelete={
          canDelete
            ? (row) => {
                if (row.boutique && blockInGlobalView()) return;
                setToDelete(row);
                setShowDeleteDialog(true);
              }
            : undefined
        }
        searchable={false}
        emptyMessage="Aucune dépense enregistrée"
      />

      {/* ============================================ */}
      {/* MODAL FORMULAIRE */}
      {/* ============================================ */}
      {showForm && (
        <DepenseForm
          depense={editing}
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

      {/* ============================================ */}
      {/* MODAL DÉTAILS (plus clair) */}
      {/* ============================================ */}
      {viewing && (
        <DepenseDetailsModal
          depense={viewing}
          onClose={() => setViewing(null)}
          onEdit={
            canDelete && viewing.type !== "ACHAT"
              ? () => {
                  setEditing(viewing);
                  setViewing(null);
                  setShowForm(true);
                }
              : undefined
          }
        />
      )}

      {/* ============================================ */}
      {/* CONFIRM DIALOG SUPPRESSION (ADMIN uniquement) */}
      {/* ============================================ */}
      {canDelete && (
        <ConfirmDialog
          show={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Supprimer la dépense"
          message={
            toDelete
              ? `Êtes-vous sûr de vouloir supprimer la dépense "${toDelete.numero}" d'un montant de ${fmt(
                  toDelete.montant
                )} DT ?\n\nCette action est irréversible.`
              : ""
          }
          confirmText="Supprimer"
        />
      )}

      {/* ============================================ */}
      {/* STYLES RESPONSIVE */}
      {/* ============================================ */}
      <style>{`
        .depenses-filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr auto;
          gap: 10px;
          align-items: center;
        }

        @media (max-width: 1200px) {
          .depenses-filters-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 576px) {
          .depenses-filters-grid {
            grid-template-columns: 1fr;
          }
          .depenses-filters-grid > * {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================
// ✅ Sous-composant : Carte KPI
// ============================================================
const KpiCard = ({ icon, label, value, subtitle, color, bg }) => (
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
          fontSize: "18px",
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
      <div
        style={{
          fontSize: "11.5px",
          color: "var(--gray-500)",
          marginTop: "3px",
        }}
      >
        {subtitle}
      </div>
    </div>
  </div>
);

// ============================================================
// ✅ Sous-composant : Modal détails dépense (plus clair)
// ============================================================
const DepenseDetailsModal = ({ depense, onClose, onEdit }) => {
  const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n || 0);

  const isReparation = depense.type === "REPARATION";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "560px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER avec couleur selon type */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--gray-200)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: isReparation
              ? "linear-gradient(135deg, rgba(67,97,238,0.08) 0%, rgba(67,97,238,0.02) 100%)"
              : "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: isReparation ? "var(--primary)" : "var(--warning)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            {isReparation ? <FaTools /> : <FaTruck />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: isReparation ? "var(--primary)" : "var(--warning)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "2px",
              }}
            >
              {isReparation ? "Dépense réparation" : "Dépense diverse"}
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "var(--gray-900)",
                fontFamily: "monospace",
              }}
            >
              {depense.numero}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "22px",
              color: "var(--gray-400)",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gray-100)";
              e.currentTarget.style.color = "var(--gray-700)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--gray-400)";
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* MONTANT EN GRAND */}
        <div
          style={{
            padding: "20px 24px",
            background: "var(--gray-50)",
            borderBottom: "1px solid var(--gray-200)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--gray-500)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "4px",
            }}
          >
            Montant total
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "var(--danger)",
              lineHeight: 1.1,
            }}
          >
            {fmt(depense.montant)} <span style={{ fontSize: "18px" }}>DT</span>
          </div>
        </div>

        {/* DÉTAILS ORGANISÉS */}
        <div style={{ padding: "20px 24px" }}>
          <DetailRow
            icon={<FaCalendarAlt />}
            label="Date"
            value={new Date(depense.dateDepense).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />

          <DetailRow
            icon={<FaCreditCard />}
            label="Mode de paiement"
            value={
              {
                ESPECES: "💵 Espèces",
                CHEQUE: "📝 Chèque",
                VIREMENT: "🏦 Virement",
                CARTE: "💳 Carte",
              }[depense.modePaiement] || depense.modePaiement
            }
          />

          {depense.categorieDiverse && (
            <DetailRow
              icon={<FaTruck />}
              label="Catégorie"
              value={depense.categorieDiverse}
            />
          )}

          {depense.motifDiverse && (
            <DetailRow
              icon={<FaStickyNote />}
              label="Motif"
              value={depense.motifDiverse}
            />
          )}

          {depense.fournisseur && (
            <DetailRow
              icon={<FaBuilding />}
              label="Fournisseur"
              value={depense.fournisseur}
            />
          )}

          {depense.factureNumero && (
            <DetailRow
              icon={<FaFileInvoice />}
              label="N° facture"
              value={depense.factureNumero}
            />
          )}

          {depense.observation && (
            <DetailRow
              icon={<FaStickyNote />}
              label="Observation"
              value={depense.observation}
            />
          )}

          {depense.createdBy && (
            <DetailRow
              icon={<FaUser />}
              label="Créée par"
              value={`${depense.createdBy.firstName || ""} ${
                depense.createdBy.lastName || ""
              }`.trim() || depense.createdBy.username || "—"}
            />
          )}
        </div>

        {/* FOOTER avec boutons */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--gray-200)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={onClose}
            className="btn-modern btn-modern-outline"
            style={{ justifyContent: "center" }}
          >
            Fermer
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="btn-modern btn-modern-primary"
              style={{ justifyContent: "center" }}
            >
              <FaEdit /> Modifier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ✅ Sous-composant : Ligne de détail
// ============================================================
const DetailRow = ({ icon, label, value }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      padding: "10px 0",
      borderBottom: "1px solid var(--gray-100)",
    }}
  >
    <div
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "8px",
        background: "var(--primary-light)",
        color: "var(--primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: "10.5px",
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
          fontSize: "13.5px",
          fontWeight: "500",
          color: "var(--gray-800)",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  </div>
);

export default DepensesList;