import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaTimes,
  FaTools,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaFileExcel,
  FaPrint,
  FaUser,
  FaMoneyBillWave,
} from "react-icons/fa";
import { getReparations, deleteReparation } from "../../api/reparations";
import { getStatuses } from "../../api/statuses";
import { getUsers } from "../../api/users";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DataTable from "../../components/common/DataTable";
import ExportButton from "../../components/common/ExportButton";
import PrintTicket from "../../components/common/PrintTicket";
import { exportReparations } from "../../api/export";
import ReparationModal from "../../components/reparations/ReparationModal";

const ReparationsList = () => {
  const navigate = useNavigate();
  const [reparations, setReparations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    reparateur: "",
    dateDebut: "",
    dateFin: "",
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReparation, setSelectedReparation] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingReparation, setEditingReparation] = useState(null);

  const handleNew = () => {
    setEditingReparation(null);
    setShowModal(true);
  };

  const handleEdit = (rep) => {
    setEditingReparation(rep);
    setShowModal(true);
  };

  const handleSuccess = () => {
    loadData(); // Recharger la liste
  };

  

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach((k) => {
        if (filters[k]) params[k] = filters[k];
      });

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
  }, []);

  const activeFiltersCount = Object.values(filters).filter((v) => v).length;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "",
      reparateur: "",
      dateDebut: "",
      dateFin: "",
    });
    setTimeout(loadData, 100);
  };

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
      if (filters[k]) params[k] = filters[k];
    });
    await exportReparations(params);
  };

  // ✅ Statistiques
  const stats = useMemo(() => {
    const total = reparations.length;
    const enAttente = reparations.filter(
      (r) =>
        r.status?.label?.toLowerCase().includes("attente") ||
        r.status?.label?.toLowerCase().includes("diagnostic"),
    ).length;
    const enCours = reparations.filter(
      (r) =>
        r.status?.label?.toLowerCase().includes("réparation") ||
        r.status?.label?.toLowerCase().includes("cours"),
    ).length;
    const terminees = reparations.filter(
      (r) =>
        r.status?.label?.toLowerCase().includes("réparé") ||
        r.status?.label?.toLowerCase().includes("prêt") ||
        r.status?.label?.toLowerCase().includes("livré"),
    ).length;
    const totalCA = reparations.reduce((sum, r) => sum + (r.prix || 0), 0);
    return { total, enAttente, enCours, terminees, totalCA };
  }, [reparations]);

  const columns = [
    {
      name: "N°",
      selector: (row) => row.numero,
      sortable: true,
      width: "120px",
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
      name: "Client",
      selector: (row) => row.client?.nom,
      sortable: true,
      cell: (row) => (
        <div>
          <div
            style={{
              fontWeight: "600",
              fontSize: "13px",
              color: "var(--gray-800)",
            }}
          >
            {row.client?.nom || "N/A"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--gray-500)" }}>
            {row.client?.phone}
          </div>
        </div>
      ),
    },
    {
      name: "Appareil",
      selector: (row) => `${row.marque} ${row.modele}`,
      sortable: true,
      cell: (row) => (
        <div>
          <div
            style={{
              fontWeight: "600",
              fontSize: "13px",
              color: "var(--gray-800)",
            }}
          >
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
      width: "150px",
      cell: (row) => (
        <span
          className="badge-modern"
          style={{
            background: row.status?.color || "var(--gray-500)",
            color: "white",
            whiteSpace: "nowrap",
          }}
        >
          {row.status?.label || "N/A"}
        </span>
      ),
    },
    {
      name: "Prix",
      selector: (row) => row.prix,
      sortable: true,
      cell: (row) => (
        <div style={{ textAlign: "right", minWidth: "80px" }}>
          <div
            style={{
              fontWeight: "700",
              fontSize: "13px",
              color: "var(--gray-800)",
            }}
          >
            {(row.prix || 0).toFixed(2)}
          </div>
          <div style={{ fontSize: "10px", color: "var(--gray-500)" }}>DT</div>
        </div>
      ),
    },
    {
      name: "Reste",
      selector: (row) => (row.prix || 0) - (row.acompte || 0),
      sortable: true,
      cell: (row) => {
        const reste = (row.prix || 0) - (row.acompte || 0);
        return (
          <div style={{ textAlign: "right", minWidth: "80px" }}>
            <div
              style={{
                fontWeight: "700",
                fontSize: "13px",
                color: reste > 0 ? "var(--danger)" : "var(--success)",
              }}
            >
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
      cell: (row) =>
        row.reparateur ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background:
                  "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "700",
                flexShrink: 0,
              }}
            >
              {row.reparateur.firstName?.charAt(0)}
              {row.reparateur.lastName?.charAt(0)}
            </div>
            <span style={{ fontSize: "12.5px", color: "var(--gray-700)" }}>
              {row.reparateur.firstName}
            </span>
          </div>
        ) : (
          <span
            style={{
              fontSize: "12px",
              color: "var(--gray-400)",
              fontStyle: "italic",
            }}
          >
            Non assigné
          </span>
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
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reparations/${row._id}`);
            }}
            title="Voir"
          >
            <FaEye size={12} />
          </button>
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            title="Modifier"
          >
            <FaEdit size={12} />
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
            <FaPrint size={12} />
          </button>
          <button
            className="btn-icon btn-icon-danger"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedReparation(row);
              setShowDeleteDialog(true);
            }}
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
      {/* Header */}
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

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: <FaTools />,
            color: "#4361ee",
            bg: "rgba(67, 97, 238, 0.1)",
          },
          {
            label: "En attente",
            value: stats.enAttente,
            icon: <FaClock />,
            color: "#f59e0b",
            bg: "rgba(245, 158, 11, 0.1)",
          },
          {
            label: "En cours",
            value: stats.enCours,
            icon: <FaSpinner />,
            color: "#3b82f6",
            bg: "rgba(59, 130, 246, 0.1)",
          },
          {
            label: "Terminées",
            value: stats.terminees,
            icon: <FaCheckCircle />,
            color: "#10b981",
            bg: "rgba(16, 185, 129, 0.1)",
          },
        ].map((stat, i) => (
          <div key={i} className="col-6 col-lg-3">
            <div
              style={{
                background: "white",
                border: "1px solid var(--gray-200)",
                borderRadius: "16px",
                padding: "18px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                transition: "all 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
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

      {/* Recherche + Filtres */}
      <div className="card-modern mb-3" style={{ padding: "16px" }}>
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-8">
            <div style={{ position: "relative" }}>
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
                style={{ paddingLeft: "40px", width: "100%" }}
                placeholder="Rechercher par N°, client, marque, modèle..."
                value={filters.search}
                onChange={handleFilterChange}
                onKeyDown={(e) => e.key === "Enter" && loadData()}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
            <button
              className={`btn-modern ${showFilters ? "btn-modern-primary" : "btn-modern-outline"}`}
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filtres avancés
              {activeFiltersCount > 0 && (
                <span
                  style={{
                    background: showFilters ? "white" : "var(--primary)",
                    color: showFilters ? "var(--primary)" : "white",
                    borderRadius: "10px",
                    padding: "1px 7px",
                    fontSize: "10.5px",
                    fontWeight: "700",
                    marginLeft: "4px",
                  }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid var(--gray-200)",
            }}
          >
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label-modern">Statut</label>
                <select
                  name="status"
                  className="form-control-modern"
                  value={filters.status}
                  onChange={handleFilterChange}
                  style={{ width: "100%" }}
                >
                  <option value="">Tous les statuts</option>
                  {statuses.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label-modern">Réparateur</label>
                <select
                  name="reparateur"
                  className="form-control-modern"
                  value={filters.reparateur}
                  onChange={handleFilterChange}
                  style={{ width: "100%" }}
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
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label-modern">Du</label>
                <input
                  type="date"
                  name="dateDebut"
                  className="form-control-modern"
                  value={filters.dateDebut}
                  onChange={handleFilterChange}
                  style={{ width: "100%" }}
                />
              </div>
              <div className="col-6 col-md-2">
                <label className="form-label-modern">Au</label>
                <input
                  type="date"
                  name="dateFin"
                  className="form-control-modern"
                  value={filters.dateFin}
                  onChange={handleFilterChange}
                  style={{ width: "100%" }}
                />
              </div>
              <div className="col-12 col-md-2 d-flex align-items-end gap-2">
                <button
                  className="btn-modern btn-modern-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={loadData}
                >
                  Appliquer
                </button>
                <button
                  className="btn-modern btn-modern-outline"
                  style={{ justifyContent: "center" }}
                  onClick={resetFilters}
                  title="Réinitialiser"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DataTable */}
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
        onClose={() => {
          setShowModal(false);
          setEditingReparation(null);
        }}
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
    </div>
  );
};

export default ReparationsList;
