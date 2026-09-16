import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "react-data-table-component";

import {
  FaArrowLeft,
  FaEdit,
  FaUser,
  FaTools,
  FaMoneyBillWave,
  FaClock,
  FaCalendar,
  FaPhone,
  FaCheckCircle,
  FaHistory,
  FaClipboardList,
  FaTag,
  FaHourglassHalf,
  FaTimesCircle,
  FaPrint,
  FaCommentAlt,
  FaBoxOpen,
} from "react-icons/fa";
import { getReparation } from "../../api/reparations";
import { getStatuses } from "../../api/statuses";
import { getUsers } from "../../api/users";
import { getCategories } from "../../api/categories";
import { getObjets } from "../../api/objets";
import ReparationQRCode from "../../components/reparations/ReparationQRCode";
import ReparationModal from "../../components/reparations/ReparationModal";

// ✅ Labels des champs
const FIELD_LABELS = {
  prix: "Prix",
  acompte: "Acompte",
  status: "Statut",
  reparateur: "Réparateur",
  problemeDeclare: "Problème déclaré",
  panneType: "Type de panne",
  marque: "Marque / Modèle",
  modele: "Modèle",
  note: "Note",
  observations: "Observation",
  numeroSerie: "IMEI",
  accessoires: "Accessoires",
  datePrevisionnelle: "Date prévisionnelle",
  categorie: "Catégorie",
  objet: "Objet",
  client: "Client",
  observation: "Observation",
};

const ReparationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [reparation, setReparation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  // ✅ Listes de référence
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [objets, setObjets] = useState([]);

  useEffect(() => {
    loadReferenceData();
    loadReparation();
  }, [id]);

  const loadReferenceData = async () => {
    try {
      const [s, u, c, o] = await Promise.all([
        getStatuses(),
        getUsers(),
        getCategories(),
        getObjets(),
      ]);
      setStatuses(s.data);
      setUsers(u.data);
      setCategories(c.data);
      setObjets(o.data);
    } catch (err) {
      console.error("Erreur ref data:", err);
    }
  };

  const loadReparation = async () => {
    try {
      setLoading(true);
      const response = await getReparation(id);
      setReparation(response.data);
    } catch (err) {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Formatage
  const formatDate = (date) =>
    !date ? "-" : new Date(date).toLocaleDateString("fr-FR");
  const formatDateTime = (date) =>
    !date
      ? "-"
      : new Date(date).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  const formatMoney = (amount) => `${(amount || 0).toFixed(2)} DT`;

  // ✅ Résolution d'une valeur
  const resolveValue = (field, value) => {
    if (value === null || value === undefined || value === "") return "—";

    if (field === "prix" || field === "acompte") return formatMoney(value);
    if (field === "datePrevisionnelle") return formatDate(value);

    if (field === "status") {
      const status = statuses.find((s) => s._id === String(value));
      return status?.label || String(value);
    }

    if (field === "reparateur") {
      const user = users.find((u) => u._id === String(value));
      return user ? `${user.firstName} ${user.lastName}` : "Non assigné";
    }

    if (field === "categorie") {
      const cat = categories.find((c) => c._id === String(value));
      return cat?.nom || String(value);
    }

    if (field === "objet") {
      const obj = objets.find((o) => o._id === String(value));
      return obj?.nom || String(value);
    }

    if (field === "panneType") {
      const labels = {
        lcd: "Écran (LCD)",
        touch: "Tactile / Vitre",
        battery: "Batterie",
        charging_port: "Connecteur de charge",
        camera_front: "Caméra frontale",
        camera_back: "Caméra arrière",
        speaker: "Haut-parleur",
        microphone: "Microphone",
        headphone: "Jack audio",
        button_power: "Bouton Power",
        button_volume: "Boutons volume",
        software: "Logiciel / Système",
        water_damage: "Dégât d'eau",
        network: "Réseau / Signal",
        other: "Autre",
      };
      return labels[value] || value;
    }

    if (field === "observations") {
      if (Array.isArray(value)) {
        return value
          .filter((o) => o.text?.trim())
          .map((o) => o.text)
          .join(" • ");
      }
      return String(value);
    }

    return String(value);
  };

  // ✅ Utiliser UNIQUEMENT reparation.modifications
  const timelineData = useMemo(() => {
    if (!reparation) return [];

    return (reparation.modifications || [])
      .map((m, i) => ({
        id: `m-${i}-${m.field}`,
        field: m.field,
        oldValue: m.oldValue,
        newValue: m.newValue,
        user: m.modifiedBy,
        date: m.modifiedAt,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [reparation]);

  // ✅ Colonnes de la DataTable
  const columns = useMemo(
    () => [
      {
        name: "Date",
        selector: (row) => row.date,
        sortable: true,
        width: "160px",
        cell: (row) => (
          <div style={{ fontSize: "12px", color: "var(--gray-600)" }}>
            {formatDateTime(row.date)}
          </div>
        ),
      },
      {
        name: "Utilisateur",
        selector: (row) => `${row.user?.firstName} ${row.user?.lastName}`,
        sortable: true,
        width: "180px",
        cell: (row) => (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
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
              {row.user?.firstName?.charAt(0)}
              {row.user?.lastName?.charAt(0)}
            </div>
            <span
              style={{
                fontSize: "12.5px",
                fontWeight: "600",
                color: "var(--gray-800)",
              }}
            >
              {row.user?.firstName} {row.user?.lastName || "Système"}
            </span>
          </div>
        ),
      },
      {
        name: "Action",
        sortable: false,
        width: "140px",
        cell: () => (
          <span
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--gray-700)",
            }}
          >
            ✏️ Modification
          </span>
        ),
      },
      {
        name: "Détails",
        grow: 3,
        cell: (row) => {
          let content = null;

          if (row.field === "_create") {
            content = <span>Réparation créée</span>;
          } else if (row.field === "_delete") {
            content = <span>Réparation supprimée</span>;
          } else if (row.field === "observations") {
            content = (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <strong
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "var(--gray-700)",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginRight: "4px",
                  }}
                >
                  Nouvelle observation:
                </strong>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: "600",
                    color: "var(--gray-900)",
                  }}
                >
                  {resolveValue(row.field, row.newValue)}
                </span>
              </div>
            );
          } else if (row.field === "status") {
            content = (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    padding: "2px 10px",
                    borderRadius: "10px",
                    background: "var(--gray-200)",
                    color: "var(--gray-700)",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  {resolveValue("status", row.oldValue)}
                </span>
                <span style={{ color: "var(--gray-400)", fontWeight: "700" }}>
                  →
                </span>
                <span
                  style={{
                    padding: "2px 10px",
                    borderRadius: "10px",
                    background: "var(--success-light)",
                    color: "var(--success)",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  {resolveValue("status", row.newValue)}
                </span>
              </div>
            );
          } else {
            content = (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <strong
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "var(--gray-700)",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginRight: "4px",
                  }}
                >
                  {FIELD_LABELS[row.field] || row.field}:
                </strong>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--gray-500)",
                    textDecoration: "line-through",
                  }}
                >
                  {resolveValue(row.field, row.oldValue)}
                </span>
                <span style={{ color: "var(--gray-400)", fontWeight: "700" }}>
                  →
                </span>
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: "600",
                    color: "var(--gray-900)",
                  }}
                >
                  {resolveValue(row.field, row.newValue)}
                </span>
              </div>
            );
          }

          return (
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                background: "#d1fae5",
                borderLeft: "3px solid #10b981",
                borderRadius: "6px",
                color: "var(--gray-800)",
                maxWidth: "100%",
              }}
            >
              {content}
            </div>
          );
        },
      },
    ],
    [statuses, users, categories, objets],
  );

  // ✅ Style personnalisé pour la DataTable
  const customStyles = {
    table: {
      style: {
        backgroundColor: "white",
        borderRadius: "12px",
      },
    },
    headRow: {
      style: {
        backgroundColor: "var(--gray-50)",
        borderBottom: "2px solid var(--gray-200)",
        minHeight: "44px",
      },
    },
    headCells: {
      style: {
        fontSize: "11px",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        color: "var(--gray-600)",
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
    rows: {
      style: {
        minHeight: "60px",
        fontSize: "13px",
        "&:not(:last-of-type)": {
          borderBottom: "1px solid var(--gray-100)",
        },
        "&:hover": {
          backgroundColor: "var(--gray-50)",
        },
      },
    },
    cells: {
      style: {
        paddingLeft: "16px",
        paddingRight: "16px",
      },
    },
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 20px",
          gap: "16px",
        }}
      >
        <div className="spinner-modern" />
        <p style={{ color: "var(--gray-500)", fontSize: "13.5px" }}>
          Chargement...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="card-modern"
        style={{ background: "var(--danger-light)", color: "var(--danger)" }}
      >
        ⚠️ {error}
      </div>
    );
  }

  if (!reparation) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔧</div>
        <div className="empty-state-title">Réparation non trouvée</div>
      </div>
    );
  }

  const reste = (reparation.prix || 0) - (reparation.acompte || 0);

  return (
    <>
      <div
        className="fade-in-up"
        style={{ maxWidth: "1400px", margin: "0 auto" }}
      >
        {/* Bouton retour */}
        <button
          className="btn-modern btn-modern-outline mb-3"
          onClick={() => navigate("/reparations")}
          style={{ padding: "8px 14px" }}
        >
          <FaArrowLeft size={12} /> Retour aux réparations
        </button>

        {/* EN-TÊTE */}
        <div className="card-modern mb-3" style={{ padding: "24px" }}>
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-7">
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "16px",
                    background:
                      "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    boxShadow: "0 6px 16px rgba(67, 97, 238, 0.3)",
                    flexShrink: 0,
                  }}
                >
                  <FaTools />
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <h1
                      style={{
                        fontSize: "22px",
                        fontWeight: "800",
                        color: "var(--gray-900)",
                        margin: 0,
                        fontFamily: "monospace",
                      }}
                    >
                      {reparation.numero}
                    </h1>
                    <span
                      className="badge-modern"
                      style={{
                        background:
                          reparation.status?.color || "var(--gray-500)",
                        color: "white",
                      }}
                    >
                      {reparation.status?.label}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "12.5px",
                      color: "var(--gray-500)",
                      margin: "4px 0 0",
                    }}
                  >
                    Créé le {formatDateTime(reparation.createdAt)} par{" "}
                    {reparation.createdBy?.firstName}{" "}
                    {reparation.createdBy?.lastName}
                  </p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-5">
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn-modern btn-modern-outline"
                  onClick={() => {
                    const token = localStorage.getItem("accessToken");
                    const apiUrl =
                      import.meta.env.VITE_API_URL ||
                      "http://localhost:5000/api";
                    fetch(`${apiUrl}/reparations/${reparation._id}/ticket`, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                      .then((res) => res.text())
                      .then((html) => {
                        const win = window.open(
                          "",
                          "_blank",
                          "width=400,height=600",
                        );
                        win.document.write(html);
                        win.document.close();
                        win.onload = () => setTimeout(() => win.print(), 500);
                      });
                  }}
                >
                  <FaPrint /> Imprimer
                </button>

                <button
                  className="btn-modern btn-modern-primary"
                  onClick={() => setShowEditModal(true)}
                >
                  <FaEdit /> Modifier
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CORPS */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-lg-6">
            {/* CLIENT */}
            <div className="card-modern mb-3">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--gray-100)",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaUser size={13} />
                </div>
                <h6
                  style={{
                    fontSize: "12.5px",
                    fontWeight: "700",
                    color: "var(--gray-800)",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Client
                </h6>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: "700",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(67, 97, 238, 0.25)",
                  }}
                >
                  {reparation.client?.nom?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "var(--gray-900)",
                      marginBottom: "4px",
                    }}
                  >
                    {reparation.client?.nom}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      className="badge-modern badge-modern-primary"
                      style={{ fontSize: "10px" }}
                    >
                      {reparation.client?.code}
                    </span>
                    <a
                      href={`tel:${reparation.client?.phone}`}
                      style={{
                        fontSize: "12.5px",
                        color: "var(--gray-600)",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FaPhone size={10} /> {reparation.client?.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* APPAREIL */}
            <div className="card-modern mb-3">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--gray-100)",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "var(--info-light)",
                    color: "var(--info)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaTools size={13} />
                </div>
                <h6
                  style={{
                    fontSize: "12.5px",
                    fontWeight: "700",
                    color: "var(--gray-800)",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Appareil
                </h6>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "10px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                  }}
                >
                  <span style={{ fontSize: "12.5px", color: "var(--gray-500)", fontWeight: "500" }}>
                    Type
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--gray-800)", fontWeight: "600" }}>
                    {reparation.objet?.nom}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderTop: "1px solid var(--gray-100)",
                  }}
                >
                  <span style={{ fontSize: "12.5px", color: "var(--gray-500)", fontWeight: "500" }}>
                    Catégorie
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--gray-800)", fontWeight: "600" }}>
                    {reparation.categorie?.nom}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderTop: "1px solid var(--gray-100)",
                  }}
                >
                  <span style={{ fontSize: "12.5px", color: "var(--gray-500)", fontWeight: "500" }}>
                    Marque / Modèle
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--gray-800)", fontWeight: "600" }}>
                    {reparation.marque} {reparation.modele}
                  </span>
                </div>
                {reparation.numeroSerie && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderTop: "1px solid var(--gray-100)",
                    }}
                  >
                    <span style={{ fontSize: "12.5px", color: "var(--gray-500)", fontWeight: "500" }}>
                      IMEI
                    </span>
                    <span
                      style={{
                        fontSize: "12.5px",
                        color: "var(--gray-700)",
                        fontFamily: "monospace",
                        fontWeight: "600",
                      }}
                    >
                      {reparation.numeroSerie}
                    </span>
                  </div>
                )}
              </div>
            </div>

                     {/* PROBLÈME */}
            <div className="card-modern mb-3">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--gray-100)",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "var(--warning-light)",
                    color: "var(--warning)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaClipboardList size={13} />
                </div>
                <h6
                  style={{
                    fontSize: "12.5px",
                    fontWeight: "700",
                    color: "var(--gray-800)",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Panne
                </h6>
              </div>

              {/* ✅ TYPE DE PANNE */}
              <div style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    fontSize: "10.5px",
                    fontWeight: "700",
                    color: "var(--gray-500)",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginBottom: "8px",
                  }}
                >
                  🔧 Type de panne
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    background: "var(--warning-light)",
                    borderRadius: "10px",
                    borderLeft: "4px solid var(--warning)",
                    fontSize: "13.5px",
                    color: "var(--gray-800)",
                    fontWeight: "600",
                    lineHeight: 1.6,
                  }}
                >
                  {resolveValue("panneType", reparation.panneType) || "Non défini"}
                </div>
              </div>

              {/* ✅ DESCRIPTION DU PROBLÈME */}
              <div style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    fontSize: "10.5px",
                    fontWeight: "700",
                    color: "var(--gray-500)",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginBottom: "8px",
                  }}
                >
                  📝 Description du problème
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    background: "var(--gray-50)",
                    borderRadius: "10px",
                    borderLeft: "4px solid var(--gray-300)",
                    fontSize: "13px",
                    color: "var(--gray-700)",
                    lineHeight: 1.6,
                  }}
                >
                  {reparation.problemeDeclare || "Aucune description fournie"}
                </div>
              </div>

              {/* ✅ NOTE INTERNE */}
              {reparation.note && (
                <div>
                  <div
                    style={{
                      fontSize: "10.5px",
                      fontWeight: "700",
                      color: "var(--gray-500)",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                      marginBottom: "8px",
                    }}
                  >
                    📌 Note interne
                  </div>
                  <div
                    style={{
                      padding: "12px 14px",
                      background: "var(--primary-light)",
                      borderRadius: "10px",
                      borderLeft: "4px solid var(--primary)",
                      fontSize: "12.5px",
                      color: "var(--gray-700)",
                      lineHeight: 1.5,
                    }}
                  >
                    {reparation.note}
                  </div>
                </div>
              )}
            </div>

            {/* PAIEMENT */}
            <div className="card-modern">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--gray-100)",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "var(--success-light)",
                    color: "var(--success)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaMoneyBillWave size={13} />
                </div>
                <h6
                  style={{
                    fontSize: "12.5px",
                    fontWeight: "700",
                    color: "var(--gray-800)",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Paiement
                </h6>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "10px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                  }}
                >
                  <span style={{ fontSize: "12.5px", color: "var(--gray-500)", fontWeight: "500" }}>
                    Prix total
                  </span>
                  <strong style={{ fontSize: "14px", color: "var(--gray-800)" }}>
                    {formatMoney(reparation.prix)}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderTop: "1px solid var(--gray-100)",
                  }}
                >
                  <span style={{ fontSize: "12.5px", color: "var(--gray-500)", fontWeight: "500" }}>
                    Acompte
                  </span>
                  <strong style={{ fontSize: "14px", color: "var(--success)" }}>
                    {formatMoney(reparation.acompte)}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    marginTop: "4px",
                    background:
                      reste > 0
                        ? "var(--danger-light)"
                        : "var(--success-light)",
                    borderRadius: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: "700",
                      color: reste > 0 ? "var(--danger)" : "var(--success)",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Reste à payer
                  </span>
                  <strong
                    style={{
                      fontSize: "18px",
                      fontWeight: "800",
                      color: reste > 0 ? "var(--danger)" : "var(--success)",
                    }}
                  >
                    {formatMoney(reste)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* QR CODE */}
          <div className="col-12 col-lg-6">
            <ReparationQRCode reparation={reparation} />
          </div>
        </div>

        {/* HISTORIQUE */}
        <div className="card-modern" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "20px 24px",
              borderBottom: "1px solid var(--gray-200)",
              background: "var(--gray-50)",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaHistory size={13} />
            </div>
            <h6
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "var(--gray-700)",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Historique & Modifications
            </h6>
            <span
              className="badge-modern badge-modern-gray"
              style={{ marginLeft: "auto" }}
            >
              {timelineData.length} entrée(s)
            </span>
          </div>

          <DataTable
            columns={columns}
            data={timelineData}
            customStyles={customStyles}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[5, 10, 25, 50]}
            paginationComponentOptions={{
              rowsPerPageText: "Lignes par page:",
              rangeSeparatorText: "sur",
              selectAllRowsItem: true,
              selectAllRowsItemText: "Tous",
            }}
            noDataComponent={
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "var(--gray-500)",
                }}
              >
                <div
                  style={{
                    fontSize: "36px",
                    marginBottom: "8px",
                    opacity: 0.3,
                  }}
                >
                  📭
                </div>
                <div style={{ fontSize: "13px" }}>Aucun historique</div>
              </div>
            }
            highlightOnHover
            persistTableHead
          />
        </div>
      </div>

      {/* ✅ MODAL - EN DEHORS DU CONTENEUR PRINCIPAL */}
      <ReparationModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          loadReparation();
        }}
        reparation={reparation}
      />
    </>
  );
};

export default ReparationDetail;