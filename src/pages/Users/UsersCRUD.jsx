import React, { useState, useEffect, useMemo } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
  FaUser,
  FaKey,
  FaUserCog,
  FaSave,
  FaTimes,
  FaCrown,
  FaBriefcase,
  FaWrench,
  FaEnvelope,
  FaShieldAlt,
  FaCheck,
  FaLayerGroup,
  FaPhone,
  FaEye,
  FaEyeSlash,
  FaClock,
  FaTools,
} from "react-icons/fa";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getAvailableModules,
} from "../../api/users";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import DataTable from "../../components/common/DataTable";

const UsersCRUD = () => {
  const [users, setUsers] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [defaultPermissions, setDefaultPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "COMMERCIAL",
    isActive: true,
    permissions: [],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  // ✅ Configuration des modules avec LECTURE et ÉCRITURE
  const MODULE_CONFIG = {
    // Principal
    dashboard: { label: "Tableau de bord", icon: "📊", category: "principal" },

    // Gestion
    clients: { label: "Clients", icon: "👥", category: "gestion" },
    reparations: { label: "Réparations", icon: "🔧", category: "gestion" },
    paiements: { label: "Paiements", icon: "💰", category: "gestion" },

    // Configuration - Familles
    familles: { label: "Familles", icon: "📁", category: "configuration" },
    "familles:read": {
      label: "Familles (lecture seule)",
      icon: "👁️",
      category: "configuration",
      isRead: true,
    },

    // Configuration - Catégories
    categories: { label: "Catégories", icon: "📂", category: "configuration" },
    "categories:read": {
      label: "Catégories (lecture seule)",
      icon: "👁️",
      category: "configuration",
      isRead: true,
    },

    // Configuration - Objets
    objets: { label: "Objets", icon: "📦", category: "configuration" },
    "objets:read": {
      label: "Objets (lecture seule)",
      icon: "👁️",
      category: "configuration",
      isRead: true,
    },

    // Configuration - Statuts
    statuses: { label: "Statuts", icon: "🏷️", category: "configuration" },
    "statuses:read": {
      label: "Statuts (lecture seule)",
      icon: "👁️",
      category: "configuration",
      isRead: true,
    },

    // Administration
    users: { label: "Utilisateurs", icon: "👤", category: "administration" },
    history: { label: "Historique", icon: "📜", category: "administration" },
  };

  const CATEGORIES = {
    principal: { label: "Principal", color: "#4361ee" },
    gestion: { label: "Gestion", icon: "💼", color: "#3b82f6" },
    configuration: { label: "Configuration", color: "#f59e0b" },
    administration: { label: "Administration", color: "#ef4444" },
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, modulesRes] = await Promise.all([
        getUsers(),
        getAvailableModules(),
      ]);
      setUsers(usersRes.data);
      setAvailableModules(modulesRes.data.modules || []);
      setDefaultPermissions(modulesRes.data.defaultPermissions || {});
    } catch (err) {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.phone?.toLowerCase().includes(term) ||
          u.firstName?.toLowerCase().includes(term) ||
          u.lastName?.toLowerCase().includes(term),
      );
    }
    if (filterRole) result = result.filter((u) => u.role === filterRole);
    if (filterStatus !== "")
      result = result.filter((u) => u.isActive === (filterStatus === "true"));
    return result;
  }, [searchTerm, filterRole, filterStatus, users]);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setActiveTab("info");
    setShowPassword(false);
    setFormData(
      item
        ? {
            username: item.username,
            email: item.email,
            phone: item.phone || "",
            password: "",
            firstName: item.firstName,
            lastName: item.lastName,
            role: item.role,
            isActive: item.isActive,
            permissions:
              item.permissions || defaultPermissions[item.role] || [],
          }
        : {
            username: "",
            email: "",
            phone: "",
            password: "",
            firstName: "",
            lastName: "",
            role: "COMMERCIAL",
            isActive: true,
            permissions: defaultPermissions.COMMERCIAL || [],
          },
    );
    setError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setError("");
    setActiveTab("info");
    setShowPassword(false);
  };

  const handleRoleChange = (newRole) => {
    setFormData({
      ...formData,
      role: newRole,
      permissions: defaultPermissions[newRole] || [],
    });
  };

  const togglePermission = (module) => {
    const current = formData.permissions || [];
    const updated = current.includes(module)
      ? current.filter((m) => m !== module)
      : [...current, module];
    setFormData({ ...formData, permissions: updated });
  };

  const toggleCategory = (category) => {
    const modulesInCategory = availableModules.filter(
      (m) => MODULE_CONFIG[m]?.category === category,
    );
    const current = formData.permissions || [];
    const allSelected = modulesInCategory.every((m) => current.includes(m));

    let updated;
    if (allSelected) {
      updated = current.filter((m) => !modulesInCategory.includes(m));
    } else {
      updated = [...new Set([...current, ...modulesInCategory])];
    }
    setFormData({ ...formData, permissions: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.username.trim())
      return setError("Le nom d'utilisateur est obligatoire");
    if (!formData.email.trim()) return setError("L'email est obligatoire");
    if (!formData.firstName.trim())
      return setError("Le prénom est obligatoire");
    if (!formData.lastName.trim()) return setError("Le nom est obligatoire");
    if (!editingItem && !formData.password)
      return setError("Le mot de passe est obligatoire");
    if (formData.password && formData.password.length < 6)
      return setError("Le mot de passe doit contenir au moins 6 caractères");
    if (!formData.permissions || formData.permissions.length === 0) {
      return setError("Au moins un module doit être accessible");
    }

    try {
      const data = { ...formData };
      if (!data.password || data.password.trim() === "") delete data.password;

      if (editingItem) {
        await updateUser(editingItem._id, data);
        setSuccess("Utilisateur modifié avec succès");
      } else {
        await createUser(data);
        setSuccess("Utilisateur créé avec succès");
      }
      handleCloseModal();
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur");
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await toggleUserStatus(user._id);
      setSuccess(`Utilisateur ${user.isActive ? "désactivé" : "activé"}`);
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(editingItem._id);
      setSuccess("Utilisateur supprimé");
      setShowDeleteDialog(false);
      loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur");
      setShowDeleteDialog(false);
    }
  };

  const roleConfig = {
    ADMIN: {
      label: "Admin",
      icon: <FaCrown size={10} />,
      className: "badge-modern-danger",
    },
    COMMERCIAL: {
      label: "Commercial",
      icon: <FaBriefcase size={10} />,
      className: "badge-modern-primary",
    },
    REPARATEUR: {
      label: "Réparateur",
      icon: <FaWrench size={10} />,
      className: "badge-modern-warning",
    },
  };

  // ✅ FORMATER LA DATE DE DERNIÈRE CONNEXION
  const formatLastLogin = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const columns = [
    {
      name: "Utilisateur",
      selector: (row) => `${row.firstName} ${row.lastName}`,
      sortable: true,
      cell: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #4361ee, #3a52c9)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "13px",
            }}
          >
            {row.firstName?.charAt(0)}
            {row.lastName?.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: "600", fontSize: "13.5px" }}>
              {row.firstName} {row.lastName}
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--gray-500)" }}>
              @{row.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Contact",
      sortable: true,
      cell: (row) => (
        <div style={{ fontSize: "12px", color: "var(--gray-600)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaEnvelope size={10} style={{ color: "var(--gray-400)" }} />
            {row.email}
          </div>
          {row.phone && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "2px",
                color: "var(--gray-500)",
              }}
            >
              <FaPhone size={10} style={{ color: "var(--gray-400)" }} />
              {row.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Rôle",
      selector: (row) => row.role,
      sortable: true,
      center: true,
      width: "130px",
      cell: (row) => {
        const cfg = roleConfig[row.role];
        return (
          <span className={`badge-modern ${cfg?.className}`}>
            {cfg?.icon} {cfg?.label || row.role}
          </span>
        );
      },
    },
    {
      name: "Modules",
      center: true,
      width: "110px",
      cell: (row) => {
        const count =
          row.role === "ADMIN"
            ? availableModules.length
            : row.permissions?.length || 0;
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              justifyContent: "center",
            }}
          >
            <FaLayerGroup size={11} style={{ color: "var(--gray-400)" }} />
            <span className="badge-modern badge-modern-gray">{count}</span>
          </div>
        );
      },
    },
    {
      name: "Réparations",
      selector: (row) => row.reparationsCount,
      sortable: true,
      center: true,
      width: "110px",
      cell: (row) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            justifyContent: "center",
          }}
        >
          <FaTools size={11} style={{ color: "var(--gray-400)" }} />
          <span className="badge-modern badge-modern-gray">
            {row.reparationsCount || 0}
          </span>
        </div>
      ),
    },
    {
      name: "Statut",
      selector: (row) => row.isActive,
      sortable: true,
      center: true,
      width: "100px",
      cell: (row) => (
        <span
          className={`badge-modern ${row.isActive ? "badge-modern-success" : "badge-modern-gray"}`}
        >
          {row.isActive ? "Actif" : "Inactif"}
        </span>
      ),
    },
    // ✅ COLONNE RESTAURÉE
    {
      name: "Dernière connexion",
      selector: (row) => row.lastLogin,
      sortable: true,
      width: "160px",
      cell: (row) => (
        <div
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
          title={
            row.lastLogin
              ? new Date(row.lastLogin).toLocaleString("fr-FR")
              : "Jamais connecté"
          }
        >
          <FaClock
            size={11}
            style={{ color: "var(--gray-400)", flexShrink: 0 }}
          />
          <span style={{ fontSize: "12px", color: "var(--gray-600)" }}>
            {row.lastLogin ? (
              formatLastLogin(row.lastLogin)
            ) : (
              <span style={{ color: "var(--gray-400)", fontStyle: "italic" }}>
                Jamais
              </span>
            )}
          </span>
        </div>
      ),
    },
    {
      name: "Actions",
      center: true,
      width: "140px",
      cell: (row) => (
        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
          <button
            className="btn-icon"
            onClick={() => handleOpenModal(row)}
            title="Modifier"
          >
            <FaEdit size={12} />
          </button>
          <button
            className="btn-icon"
            onClick={() => handleToggleStatus(row)}
            title={row.isActive ? "Désactiver" : "Activer"}
            style={{
              color: row.isActive ? "var(--warning)" : "var(--success)",
              borderColor: row.isActive ? "var(--warning)" : "var(--success)",
            }}
          >
            {row.isActive ? (
              <FaToggleOn size={12} />
            ) : (
              <FaToggleOff size={12} />
            )}
          </button>
          <button
            className="btn-icon btn-icon-danger"
            onClick={() => {
              setEditingItem(row);
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

  const modulesByCategory = availableModules.reduce((acc, module) => {
    const cat = MODULE_CONFIG[module]?.category || "autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(module);
    return acc;
  }, {});

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
            <FaUserCog
              style={{ marginRight: "8px", color: "var(--primary)" }}
            />
            Gestion des utilisateurs
          </h1>
          <p style={{ fontSize: "13px", color: "var(--gray-500)", margin: 0 }}>
            {users.length} utilisateur(s) •{" "}
            {users.filter((u) => u.isActive).length} actif(s)
          </p>
        </div>
        <button
          className="btn-modern btn-modern-primary"
          onClick={() => handleOpenModal()}
        >
          <FaPlus /> Nouvel utilisateur
        </button>
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
      {error && !showModal && (
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

      {/* Filtres */}
      <div className="card-modern mb-4" style={{ padding: "16px" }}>
        <div className="row g-3">
          <div className="col-12 col-md-5">
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
                className="form-control-modern"
                style={{ paddingLeft: "40px", width: "100%" }}
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-control-modern"
              style={{ width: "100%" }}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">Tous les rôles</option>
              <option value="ADMIN">👑 Administrateurs</option>
              <option value="COMMERCIAL">💼 Commerciaux</option>
              <option value="REPARATEUR">🔧 Réparateurs</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-control-modern"
              style={{ width: "100%" }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="true">✅ Actifs</option>
              <option value="false">✗ Inactifs</option>
            </select>
          </div>
          <div className="col-12 col-md-1">
            <button
              className="btn-modern btn-modern-outline"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => {
                setSearchTerm("");
                setFilterRole("");
                setFilterStatus("");
              }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        actions={false}
        searchable={false}
        emptyMessage="Aucun utilisateur trouvé"
        paginationPerPage={10}
      />

      {/* MODAL */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          tabIndex="-1"
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            style={{ maxWidth: "700px" }}
          >
            <div
              className="modal-content"
              style={{
                border: "none",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--gray-200)",
                  background:
                    "linear-gradient(135deg, rgba(67, 97, 238, 0.05) 0%, rgba(67, 97, 238, 0.02) 100%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}
                >
                  <FaUserCog />
                </div>
                <div style={{ flex: 1 }}>
                  <h5
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "var(--gray-900)",
                      margin: 0,
                    }}
                  >
                    {editingItem
                      ? "Modifier l'utilisateur"
                      : "Nouvel utilisateur"}
                  </h5>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--gray-500)",
                      margin: "2px 0 0",
                    }}
                  >
                    {editingItem
                      ? editingItem.username
                      : "Créez un nouveau compte"}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "none",
                    background: "white",
                    color: "var(--gray-500)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--gray-200)",
                  background: "var(--gray-50)",
                }}
              >
                {[
                  { id: "info", label: "Informations", icon: <FaUser /> },
                  {
                    id: "permissions",
                    label: "Permissions",
                    icon: <FaShieldAlt />,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: "14px 20px",
                      border: "none",
                      background:
                        activeTab === tab.id ? "white" : "transparent",
                      borderBottom:
                        activeTab === tab.id
                          ? "2px solid var(--primary)"
                          : "2px solid transparent",
                      color:
                        activeTab === tab.id
                          ? "var(--primary)"
                          : "var(--gray-500)",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 150ms ease",
                    }}
                  >
                    {tab.icon} {tab.label}
                    {tab.id === "permissions" && (
                      <span
                        className="badge-modern badge-modern-primary"
                        style={{ fontSize: "10px" }}
                      >
                        {formData.permissions?.length || 0}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    padding: "24px",
                    maxHeight: "60vh",
                    overflowY: "auto",
                  }}
                >
                  {error && (
                    <div
                      style={{
                        padding: "12px 16px",
                        background: "var(--danger-light)",
                        color: "var(--danger)",
                        borderRadius: "10px",
                        marginBottom: "20px",
                        fontSize: "13px",
                      }}
                    >
                      ⚠️ {error}
                    </div>
                  )}

                  {activeTab === "info" && (
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label-modern">
                          <FaUser
                            size={11}
                            style={{
                              marginRight: "6px",
                              color: "var(--gray-400)",
                            }}
                          />
                          Prénom{" "}
                          <span style={{ color: "var(--danger)" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control-modern"
                          placeholder="Ex: Ahmed"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              firstName: e.target.value,
                            })
                          }
                          autoFocus
                          style={{ width: "100%" }}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label-modern">
                          <FaUser
                            size={11}
                            style={{
                              marginRight: "6px",
                              color: "var(--gray-400)",
                            }}
                          />
                          Nom <span style={{ color: "var(--danger)" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control-modern"
                          placeholder="Ex: Ben Ali"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lastName: e.target.value,
                            })
                          }
                          style={{ width: "100%" }}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label-modern">
                          <FaUserCog
                            size={11}
                            style={{
                              marginRight: "6px",
                              color: "var(--gray-400)",
                            }}
                          />
                          Nom d'utilisateur{" "}
                          <span style={{ color: "var(--danger)" }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control-modern"
                          placeholder="Ex: jdupont"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              username: e.target.value,
                            })
                          }
                          style={{ width: "100%" }}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label-modern">
                          <FaPhone
                            size={11}
                            style={{
                              marginRight: "6px",
                              color: "var(--gray-400)",
                            }}
                          />
                          Numéro de téléphone
                        </label>
                        <input
                          type="tel"
                          className="form-control-modern"
                          placeholder="Ex: 20 123 456"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          style={{ width: "100%" }}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label-modern">
                          <FaEnvelope
                            size={11}
                            style={{
                              marginRight: "6px",
                              color: "var(--gray-400)",
                            }}
                          />
                          Email{" "}
                          <span style={{ color: "var(--danger)" }}>*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control-modern"
                          placeholder="Ex: user@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          style={{ width: "100%" }}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label-modern">
                          <FaKey
                            size={11}
                            style={{
                              marginRight: "6px",
                              color: "var(--gray-400)",
                            }}
                          />
                          {editingItem
                            ? "Nouveau mot de passe (laisser vide pour ne pas modifier)"
                            : "Mot de passe *"}
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control-modern"
                            placeholder={
                              editingItem
                                ? "Nouveau mot de passe"
                                : "Minimum 6 caractères"
                            }
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              })
                            }
                            required={!editingItem}
                            style={{ width: "100%", paddingRight: "44px" }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "transparent",
                              border: "none",
                              color: "var(--gray-400)",
                              cursor: "pointer",
                              padding: "4px",
                              display: "flex",
                              alignItems: "center",
                              transition: "color 150ms ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "var(--primary)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = "var(--gray-400)")
                            }
                            title={showPassword ? "Masquer" : "Afficher"}
                          >
                            {showPassword ? (
                              <FaEyeSlash size={14} />
                            ) : (
                              <FaEye size={14} />
                            )}
                          </button>
                        </div>
                        {editingItem && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--gray-500)",
                              marginTop: "4px",
                            }}
                          >
                            ℹ️ Laissez vide pour conserver le mot de passe
                            actuel
                          </div>
                        )}
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label-modern">Rôle</label>
                        <select
                          className="form-control-modern"
                          value={formData.role}
                          onChange={(e) => handleRoleChange(e.target.value)}
                          style={{ width: "100%" }}
                        >
                          <option value="ADMIN">👑 Administrateur</option>
                          <option value="COMMERCIAL">💼 Commercial</option>
                          <option value="REPARATEUR">🔧 Réparateur</option>
                        </select>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--gray-500)",
                            marginTop: "4px",
                          }}
                        >
                          ℹ️ Changer le rôle réinitialise les permissions par
                          défaut
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label-modern">Statut</label>
                        <div style={{ paddingTop: "8px" }}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  isActive: e.target.checked,
                                })
                              }
                              style={{ accentColor: "var(--success)" }}
                            />
                            <span
                              style={{ fontSize: "13.5px", fontWeight: "500" }}
                            >
                              {formData.isActive
                                ? "✅ Compte actif"
                                : "✗ Compte désactivé"}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "permissions" && (
                    <div>
                      <div
                        style={{
                          padding: "14px 16px",
                          background: "var(--primary-light)",
                          border: "1px solid var(--primary)",
                          borderRadius: "10px",
                          marginBottom: "20px",
                          fontSize: "12.5px",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                      >
                        <FaShieldAlt
                          style={{ marginTop: "2px", flexShrink: 0 }}
                        />
                        <div>
                          <strong>Modules accessibles</strong>
                          <div style={{ marginTop: "2px", opacity: 0.9 }}>
                            Sélectionnez les modules auxquels cet utilisateur
                            aura accès dans le menu.
                            {formData.role === "ADMIN" &&
                              " (L'admin a toujours accès à tout)"}
                          </div>
                        </div>
                      </div>

                      {formData.role !== "ADMIN" && (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "20px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            className="btn-modern btn-modern-outline"
                            style={{ fontSize: "12px", padding: "6px 12px" }}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                permissions: [...availableModules],
                              })
                            }
                          >
                            <FaCheck /> Tout sélectionner
                          </button>
                          <button
                            type="button"
                            className="btn-modern btn-modern-outline"
                            style={{ fontSize: "12px", padding: "6px 12px" }}
                            onClick={() =>
                              setFormData({ ...formData, permissions: [] })
                            }
                          >
                            <FaTimes /> Tout désélectionner
                          </button>
                          <button
                            type="button"
                            className="btn-modern btn-modern-outline"
                            style={{ fontSize: "12px", padding: "6px 12px" }}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                permissions:
                                  defaultPermissions[formData.role] || [],
                              })
                            }
                          >
                            🔄 Par défaut ({formData.role})
                          </button>
                        </div>
                      )}

                      {Object.entries(modulesByCategory).map(
                        ([categoryKey, modules]) => {
                          const categoryConfig = CATEGORIES[categoryKey] || {
                            label: categoryKey,
                            color: "#6b7280",
                          };
                          const isAdmin = formData.role === "ADMIN";

                          return (
                            <div
                              key={categoryKey}
                              style={{ marginBottom: "24px" }}
                            >
                              {/* Header catégorie */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: "12px",
                                  paddingBottom: "8px",
                                  borderBottom: `2px solid ${categoryConfig.color}20`,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      background: categoryConfig.color,
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "12.5px",
                                      fontWeight: "700",
                                      color: categoryConfig.color,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {categoryConfig.label}
                                  </span>
                                </div>
                              </div>

                              {/* Liste des modules */}
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                }}
                              >
                                {modules.map((moduleKey) => {
                                  const moduleConfig = MODULE_CONFIG[
                                    moduleKey
                                  ] || { label: moduleKey, icon: "📦" };
                                  const isSelected =
                                    isAdmin ||
                                    formData.permissions?.includes(moduleKey);
                                  const isDisabled = isAdmin;
                                  const isRead = moduleConfig.isRead;

                                  return (
                                    <div
                                      key={moduleKey}
                                      onClick={() =>
                                        !isDisabled &&
                                        togglePermission(moduleKey)
                                      }
                                      style={{
                                        padding: "12px 16px",
                                        border: `1.5px ${isRead ? "dashed" : "solid"} ${isSelected ? categoryConfig.color : "var(--gray-200)"}`,
                                        borderRadius: "10px",
                                        background: isSelected
                                          ? `${categoryConfig.color}10`
                                          : "white",
                                        cursor: isDisabled
                                          ? "not-allowed"
                                          : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        transition: "all 150ms ease",
                                        opacity: isDisabled ? 0.7 : 1,
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isDisabled) {
                                          e.currentTarget.style.transform =
                                            "translateX(4px)";
                                          e.currentTarget.style.borderColor =
                                            categoryConfig.color;
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform =
                                          "translateX(0)";
                                        e.currentTarget.style.borderColor =
                                          isSelected
                                            ? categoryConfig.color
                                            : "var(--gray-200)";
                                      }}
                                    >
                                      {/* Checkbox */}
                                      <div
                                        style={{
                                          width: "22px",
                                          height: "22px",
                                          borderRadius: "6px",
                                          border: `2px solid ${isSelected ? categoryConfig.color : "var(--gray-300)"}`,
                                          background: isSelected
                                            ? categoryConfig.color
                                            : "white",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          flexShrink: 0,
                                          transition: "all 150ms ease",
                                        }}
                                      >
                                        {isSelected && (
                                          <FaCheck size={11} color="white" />
                                        )}
                                      </div>

                                      {/* Icon */}
                                      <span style={{ fontSize: "18px" }}>
                                        {moduleConfig.icon}
                                      </span>

                                      {/* Label */}
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                          style={{
                                            fontSize: "13.5px",
                                            fontWeight: "600",
                                            color: isSelected
                                              ? "var(--gray-900)"
                                              : "var(--gray-700)",
                                            fontStyle: isRead
                                              ? "italic"
                                              : "normal",
                                          }}
                                        >
                                          {moduleConfig.label}
                                        </div>
                                        {isRead && (
                                          <div
                                            style={{
                                              fontSize: "10.5px",
                                              color: "var(--gray-500)",
                                              marginTop: "2px",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "4px",
                                            }}
                                          >
                                            👁️ Lecture seule (pour les
                                            dropdowns)
                                          </div>
                                        )}
                                      </div>

                                      {/* Badge LECTURE */}
                                      {isRead && (
                                        <span
                                          style={{
                                            fontSize: "9px",
                                            fontWeight: "700",
                                            padding: "3px 8px",
                                            borderRadius: "10px",
                                            background: "var(--gray-100)",
                                            color: "var(--gray-600)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.3px",
                                          }}
                                        >
                                          Lecture
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        },
                      )}

                      <div
                        style={{
                          marginTop: "20px",
                          padding: "12px 16px",
                          background: "var(--gray-50)",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "13px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--gray-600)",
                            fontWeight: "500",
                          }}
                        >
                          📊 Modules sélectionnés
                        </span>
                        <strong
                          style={{ color: "var(--primary)", fontSize: "16px" }}
                        >
                          {formData.role === "ADMIN"
                            ? availableModules.length
                            : formData.permissions?.length || 0}{" "}
                          / {availableModules.length}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: "16px 24px",
                    borderTop: "1px solid var(--gray-200)",
                    background: "var(--gray-50)",
                    display: "flex",
                    gap: "10px",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--gray-500)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {activeTab === "info" && "Étape 1 sur 2"}
                    {activeTab === "permissions" && "Étape 2 sur 2"}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="btn-modern btn-modern-outline"
                    >
                      <FaTimes /> Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn-modern btn-modern-primary"
                    >
                      <FaSave /> {editingItem ? "Modifier" : "Créer"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        show={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.firstName} ${editingItem?.lastName}" ?`}
        confirmText="Supprimer"
      />
    </div>
  );
};

export default UsersCRUD;
