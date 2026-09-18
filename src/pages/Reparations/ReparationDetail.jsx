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
  FaPhone,
  FaHistory,
  FaClipboardList,
  FaPrint,
  FaStethoscope,
  FaCheck,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { getReparation } from "../../api/reparations";
import { getStatuses } from "../../api/statuses";
import { getUsers } from "../../api/users";
import { getCategories } from "../../api/categories";
import { getObjets } from "../../api/objets";
import ReparationQRCode from "../../components/reparations/ReparationQRCode";
import ReparationModal from "../../components/reparations/ReparationModal";

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
  diagnosticImprevus: "Diagnostic & Imprévus",
};

// ✅ Constante du délai d'alerte
const DELAI_ALERTE_HEURES = 48;

const ReparationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [reparation, setReparation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

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
          } else if (row.field === "diagnosticImprevus") {
            content = (
              <DiagnosticDiff oldValue={row.oldValue} newValue={row.newValue} />
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

          const isDiag = row.field === "diagnosticImprevus";
          const isDelete = row.field === "_delete";

          return (
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                background: isDelete
                  ? "var(--danger-light)"
                  : isDiag
                    ? "#fef3c7"
                    : "#d1fae5",
                borderLeft: `3px solid ${
                  isDelete
                    ? "var(--danger)"
                    : isDiag
                      ? "var(--warning)"
                      : "#10b981"
                }`,
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
    [statuses, users, categories, objets]
  );

  const customStyles = {
    table: { style: { backgroundColor: "white", borderRadius: "12px" } },
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
        "&:not(:last-of-type)": { borderBottom: "1px solid var(--gray-100)" },
        "&:hover": { backgroundColor: "var(--gray-50)" },
      },
    },
    cells: { style: { paddingLeft: "16px", paddingRight: "16px" } },
  };

  // ✅ ALERTE DÉLAI +48h (calcul AVANT les returns conditionnels)
  const alertInfo = useMemo(() => {
    if (!reparation) return null;

    // ✅ Ne pas alerter si la réparation est terminée
    const statusLabel = (reparation.status?.label || "").toLowerCase();
    const isTermine =
      statusLabel.includes("réparé") ||
      statusLabel.includes("livré") ||
      statusLabel.includes("prêt") ||
      statusLabel.includes("annulé") ||
      statusLabel.includes("refusé");

    if (isTermine) return null;

    // ✅ Calculer le temps écoulé depuis la réception
    const dateReception = reparation.dateReception || reparation.createdAt;
    if (!dateReception) return null;

    const maintenant = new Date();
    const reception = new Date(dateReception);
    const diffMs = maintenant - reception;
    const diffHeures = diffMs / (1000 * 60 * 60);

    if (diffHeures < DELAI_ALERTE_HEURES) return null;

    const jours = Math.floor(diffHeures / 24);
    const heures = Math.floor(diffHeures % 24);

    return {
      heures: Math.floor(diffHeures),
      jours,
      heuresRestantes: heures,
      dateReception: reception,
      label:
        jours > 0 ? `${jours}j ${heures}h` : `${Math.floor(diffHeures)}h`,
      depassement: Math.floor(diffHeures - DELAI_ALERTE_HEURES),
    };
  }, [reparation]);

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

  const diag = reparation.diagnosticImprevus || {};
  const hasDiag =
    diag.constat ||
    diag.imprevus?.length > 0 ||
    (diag.decisionClient?.statut &&
      diag.decisionClient.statut !== "en_attente");

  const imprevusAcceptesList = (diag.imprevus || []).filter(
    (i) => i.accepte === true
  );
  const imprevusEnAttenteList = (diag.imprevus || []).filter(
    (i) => i.accepte === null || i.accepte === undefined
  );
  const totalImprevusAcceptes = imprevusAcceptesList.reduce(
    (sum, i) => sum + (Number(i.prixSupplementaire) || 0),
    0
  );
  const resteTotal = Math.max(
    0,
    (reparation.prixTotal || reparation.prix || 0) - (reparation.acompte || 0)
  );

  return (
    <>
      <div
        className="fade-in-up"
        style={{ maxWidth: "1400px", margin: "0 auto" }}
      >
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
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
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
                          "width=400,height=600"
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

        {/* ✅ ALERTE DÉLAI +48h */}
        {alertInfo && (
          <div
            style={{
              background: "linear-gradient(135deg, #fee2e2, #fef2f2)",
              border: "1px solid #ef444440",
              borderLeft: "5px solid #ef4444",
              borderRadius: "16px",
              padding: "18px 22px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              boxShadow: "0 4px 16px rgba(239, 68, 68, 0.15)",
              animation: "pulseAlert 2s ease-in-out infinite",
              flexWrap: "wrap",
            }}
          >
            {/* Icône animée */}
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0,
                boxShadow: "0 6px 16px rgba(239, 68, 68, 0.4)",
              }}
            >
              <FaExclamationTriangle />
            </div>

            <div style={{ flex: 1, minWidth: "200px" }}>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "800",
                  color: "#991b1b",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                ⚠️ Alerte délai dépassé
                <span
                  style={{
                    padding: "3px 10px",
                    background: "#ef4444",
                    color: "white",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "0.5px",
                  }}
                >
                  +48H
                </span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#7f1d1d",
                  lineHeight: 1.5,
                }}
              >
                Cette réparation est{" "}
                <strong>en cours depuis {alertInfo.label}</strong>.
                <br />
                <span style={{ fontSize: "12px", opacity: 0.85 }}>
                  Reçue le{" "}
                  {alertInfo.dateReception.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  à{" "}
                  {alertInfo.dateReception.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Indicateur de dépassement */}
            <div
              style={{
                textAlign: "center",
                padding: "8px 14px",
                background: "white",
                borderRadius: "12px",
                border: "1px solid #ef444430",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#991b1b",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "2px",
                }}
              >
                Dépassé de
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "#ef4444",
                  fontFamily: "monospace",
                }}
              >
                +{alertInfo.depassement}h
              </div>
            </div>
          </div>
        )}

        {/* CORPS : 2 COLONNES */}
        <div className="row g-3 mb-3">
          {/* ============ COLONNE GAUCHE ============ */}
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
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12.5px",
                      color: "var(--gray-500)",
                      fontWeight: "500",
                    }}
                  >
                    Type
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--gray-800)",
                      fontWeight: "600",
                    }}
                  >
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
                  <span
                    style={{
                      fontSize: "12.5px",
                      color: "var(--gray-500)",
                      fontWeight: "500",
                    }}
                  >
                    Catégorie
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--gray-800)",
                      fontWeight: "600",
                    }}
                  >
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
                  <span
                    style={{
                      fontSize: "12.5px",
                      color: "var(--gray-500)",
                      fontWeight: "500",
                    }}
                  >
                    Marque / Modèle
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--gray-800)",
                      fontWeight: "600",
                    }}
                  >
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
                    <span
                      style={{
                        fontSize: "12.5px",
                        color: "var(--gray-500)",
                        fontWeight: "500",
                      }}
                    >
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

            {/* PANNE */}
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
              <div style={{ marginBottom: "14px" }}>
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
                  {resolveValue("panneType", reparation.panneType) ||
                    "Non défini"}
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
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

            {/* DIAGNOSTIC & IMPRÉVUS */}
            {hasDiag && (
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
                      background: "var(--warning-light)",
                      color: "var(--warning)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FaStethoscope size={13} />
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
                    Diagnostic & Imprévus
                  </h6>
                </div>

                {diag.constat && (
                  <div style={{ marginBottom: "14px" }}>
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
                      🔍 Constat du réparateur
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
                      {diag.constat}
                    </div>
                  </div>
                )}

                {diag.imprevus?.length > 0 && (
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
                      ⚠️ Imprévus découverts ({diag.imprevus.length})
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {diag.imprevus.map((imp, i) => {
                        const decision =
                          imp.accepte === true
                            ? "accepte"
                            : imp.accepte === false
                              ? "refuse"
                              : "en_attente";
                        const config = {
                          accepte: {
                            color: "var(--success)",
                            bg: "var(--success-light)",
                            icon: <FaCheck size={10} />,
                            label: "Accepté",
                          },
                          refuse: {
                            color: "var(--danger)",
                            bg: "var(--danger-light)",
                            icon: <FaTimes size={10} />,
                            label: "Refusé",
                          },
                          en_attente: {
                            color: "var(--warning)",
                            bg: "var(--warning-light)",
                            icon: <FaClock size={10} />,
                            label: "En attente",
                          },
                        }[decision];

                        return (
                          <div
                            key={i}
                            style={{
                              padding: "12px 14px",
                              background: "white",
                              border: `1px solid ${config.color}40`,
                              borderLeft: `4px solid ${config.color}`,
                              borderRadius: "10px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "10px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "var(--gray-800)",
                                }}
                              >
                                {imp.description}
                              </div>
                              {imp.noteDecision && (
                                <div
                                  style={{
                                    fontSize: "11.5px",
                                    color: "var(--gray-500)",
                                    marginTop: "2px",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {imp.noteDecision}
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flexShrink: 0,
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: "14px",
                                  color:
                                    imp.accepte === true
                                      ? "var(--success)"
                                      : "var(--gray-800)",
                                }}
                              >
                                + {imp.prixSupplementaire?.toFixed(2)} DT
                              </strong>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "10px",
                                  background: config.bg,
                                  color: config.color,
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {config.icon} {config.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============ COLONNE DROITE : QR CODE + PAIEMENT DANS UNE SEULE CARTE ============ */}
          <div className="col-12 col-lg-6">
            <div className="card-modern">
              {/* QR CODE */}
              <ReparationQRCode reparation={reparation} />

              {/* SÉPARATEUR */}
              <div
                style={{
                  margin: "20px 0",
                  borderTop: "1px dashed var(--gray-300)",
                }}
              />

              {/* PAIEMENT */}
              <div>
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {/* Prix de base */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "var(--gray-50)",
                      borderRadius: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12.5px",
                        color: "var(--gray-600)",
                        fontWeight: "500",
                      }}
                    >
                      Prix de base
                    </span>
                    <strong
                      style={{
                        fontSize: "14px",
                        color: "var(--gray-800)",
                        fontWeight: "700",
                      }}
                    >
                      {formatMoney(reparation.prix)}
                    </strong>
                  </div>

                  {/* Imprévus acceptés */}
                  {imprevusAcceptesList.length > 0 && (
                    <div
                      style={{
                        padding: "12px 14px",
                        background:
                          "linear-gradient(135deg, var(--success-light), white)",
                        borderRadius: "10px",
                        border: "1px solid var(--success)30",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "var(--success)",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        <FaCheckCircle size={11} />
                        Imprévus acceptés
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        {imprevusAcceptesList.map((imp, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "12px",
                            }}
                          >
                            <span
                              style={{
                                color: "var(--gray-600)",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              • {imp.description}
                            </span>
                            <strong
                              style={{
                                color: "var(--success)",
                                fontWeight: "600",
                              }}
                            >
                              + {formatMoney(imp.prixSupplementaire)}
                            </strong>
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingTop: "8px",
                          borderTop: "1px dashed var(--success)40",
                          fontSize: "12.5px",
                        }}
                      >
                        <span
                          style={{ color: "var(--success)", fontWeight: "600" }}
                        >
                          Sous-total imprévus
                        </span>
                        <strong
                          style={{ color: "var(--success)", fontWeight: "700" }}
                        >
                          + {formatMoney(totalImprevusAcceptes)}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Imprévus en attente */}
                  {imprevusEnAttenteList.length > 0 && (
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "var(--warning-light)",
                        borderRadius: "10px",
                        border: "1px solid var(--warning)30",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "11.5px",
                        color: "var(--warning)",
                      }}
                    >
                      <FaClock size={11} />
                      <span style={{ fontWeight: "600" }}>
                        {imprevusEnAttenteList.length} imprévu(s) en attente —
                        non comptabilisé
                      </span>
                    </div>
                  )}

                  {/* Prix total */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      background:
                        "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(67, 97, 238, 0.25)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "white",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        opacity: 0.9,
                      }}
                    >
                      💰 Prix total
                    </span>
                    <strong
                      style={{
                        fontSize: "22px",
                        fontWeight: "800",
                        color: "white",
                        letterSpacing: "-0.5px",
                      }}
                    >
                      {formatMoney(reparation.prixTotal || reparation.prix)}
                    </strong>
                  </div>

                  {/* Acompte */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "var(--gray-50)",
                      borderRadius: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12.5px",
                        color: "var(--gray-600)",
                        fontWeight: "500",
                      }}
                    >
                      Acompte versé
                    </span>
                    <strong
                      style={{
                        fontSize: "14px",
                        color: "var(--success)",
                        fontWeight: "700",
                      }}
                    >
                      − {formatMoney(reparation.acompte)}
                    </strong>
                  </div>

                  {/* Reste à payer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      background:
                        resteTotal > 0
                          ? "linear-gradient(135deg, var(--danger-light), white)"
                          : "linear-gradient(135deg, var(--success-light), white)",
                      borderRadius: "12px",
                      border:
                        resteTotal > 0
                          ? "1px solid var(--danger)40"
                          : "1px solid var(--success)40",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11.5px",
                        fontWeight: "700",
                        color:
                          resteTotal > 0 ? "var(--danger)" : "var(--success)",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Reste à payer
                    </span>
                    <strong
                      style={{
                        fontSize: "20px",
                        fontWeight: "800",
                        color:
                          resteTotal > 0 ? "var(--danger)" : "var(--success)",
                      }}
                    >
                      {formatMoney(resteTotal)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ HISTORIQUE (PLEINE LARGEUR) ============ */}
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

// ============================================================
// ✅ Composant d'affichage des différences de diagnostic
// ============================================================
const DiagnosticDiff = ({ oldValue, newValue }) => {
  const oldDiag = oldValue && typeof oldValue === "object" ? oldValue : {};
  const newDiag = newValue && typeof newValue === "object" ? newValue : {};

  const oldImprevus = Array.isArray(oldDiag.imprevus) ? oldDiag.imprevus : [];
  const newImprevus = Array.isArray(newDiag.imprevus) ? newDiag.imprevus : [];

  const oldConstat = oldDiag.constat || "";
  const newConstat = newDiag.constat || "";

  const constatChanged = oldConstat !== newConstat;

  const imprevusDiffs = [];
  const maxLen = Math.max(oldImprevus.length, newImprevus.length);

  for (let i = 0; i < maxLen; i++) {
    const oldImp = oldImprevus[i];
    const newImp = newImprevus[i];

    if (!oldImp && newImp) {
      imprevusDiffs.push({
        type: "added",
        description: newImp.description || "(sans description)",
        prix: newImp.prixSupplementaire || 0,
        accepte: newImp.accepte,
      });
    } else if (oldImp && !newImp) {
      imprevusDiffs.push({
        type: "removed",
        description: oldImp.description || "(sans description)",
        prix: oldImp.prixSupplementaire || 0,
      });
    } else if (oldImp && newImp) {
      const descChanged =
        (oldImp.description || "") !== (newImp.description || "");
      const prixChanged =
        (oldImp.prixSupplementaire || 0) !== (newImp.prixSupplementaire || 0);
      const decisionChanged = oldImp.accepte !== newImp.accepte;

      if (descChanged || prixChanged || decisionChanged) {
        imprevusDiffs.push({
          type: "modified",
          description: newImp.description,
          oldDescription: oldImp.description,
          oldPrix: oldImp.prixSupplementaire,
          newPrix: newImp.prixSupplementaire,
          oldAccepte: oldImp.accepte,
          newAccepte: newImp.accepte,
          descChanged,
          prixChanged,
          decisionChanged,
        });
      }
    }
  }

  const hasChanges = constatChanged || imprevusDiffs.length > 0;

  if (!hasChanges) {
    return (
      <div
        style={{
          fontSize: "12px",
          color: "var(--gray-500)",
          fontStyle: "italic",
        }}
      >
        Diagnostic mis à jour
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {constatChanged && (
        <div
          style={{
            padding: "8px 10px",
            background: "white",
            borderRadius: "8px",
            borderLeft: "3px solid var(--primary)",
            fontSize: "12px",
          }}
        >
          <strong
            style={{
              fontSize: "10.5px",
              fontWeight: "700",
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              display: "block",
              marginBottom: "4px",
            }}
          >
            🔍 Constat modifié
          </strong>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {oldConstat && (
              <span
                style={{
                  color: "var(--gray-500)",
                  textDecoration: "line-through",
                  fontSize: "11.5px",
                }}
              >
                {oldConstat}
              </span>
            )}
            {newConstat && (
              <span
                style={{
                  color: "var(--gray-800)",
                  fontWeight: "600",
                  fontSize: "12px",
                }}
              >
                {newConstat}
              </span>
            )}
          </div>
        </div>
      )}

      {imprevusDiffs.map((diff, idx) => (
        <ImprevuDiffItem key={idx} diff={diff} />
      ))}
    </div>
  );
};

// ============================================================
// ✅ Sous-composant : affichage d'un imprévu modifié
// ============================================================
const ImprevuDiffItem = ({ diff }) => {
  const getDecisionConfig = (accepte) => {
    if (accepte === true)
      return {
        label: "Accepté",
        icon: "✅",
        color: "var(--success)",
        bg: "var(--success-light)",
      };
    if (accepte === false)
      return {
        label: "Refusé",
        icon: "❌",
        color: "var(--danger)",
        bg: "var(--danger-light)",
      };
    return {
      label: "En attente",
      icon: "⏳",
      color: "var(--warning)",
      bg: "var(--warning-light)",
    };
  };

  if (diff.type === "added") {
    const dec = getDecisionConfig(diff.accepte);
    return (
      <div
        style={{
          padding: "8px 10px",
          background: "white",
          borderRadius: "8px",
          borderLeft: "3px solid var(--success)",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: "700",
              color: "white",
              background: "var(--success)",
              padding: "2px 6px",
              borderRadius: "4px",
              flexShrink: 0,
            }}
          >
            ➕ AJOUT
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--gray-800)",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {diff.description}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <strong style={{ fontSize: "12.5px", color: "var(--gray-800)" }}>
            + {Number(diff.prix || 0).toFixed(2)} DT
          </strong>
          <span
            style={{
              fontSize: "10px",
              fontWeight: "700",
              padding: "2px 8px",
              borderRadius: "8px",
              color: dec.color,
              background: dec.bg,
            }}
          >
            {dec.icon} {dec.label}
          </span>
        </div>
      </div>
    );
  }

  if (diff.type === "removed") {
    return (
      <div
        style={{
          padding: "8px 10px",
          background: "white",
          borderRadius: "8px",
          borderLeft: "3px solid var(--danger)",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: "700",
              color: "white",
              background: "var(--danger)",
              padding: "2px 6px",
              borderRadius: "4px",
              flexShrink: 0,
            }}
          >
            ➖ SUPPRIMÉ
          </span>
          <span
            style={{
              fontSize: "12px",
              color: "var(--gray-600)",
              textDecoration: "line-through",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {diff.description}
          </span>
        </div>
        <strong
          style={{ fontSize: "12.5px", color: "var(--danger)", flexShrink: 0 }}
        >
          − {Number(diff.prix || 0).toFixed(2)} DT
        </strong>
      </div>
    );
  }

  if (diff.type === "modified") {
    const oldDec = getDecisionConfig(diff.oldAccepte);
    const newDec = getDecisionConfig(diff.newAccepte);

    return (
      <div
        style={{
          padding: "10px",
          background: "white",
          borderRadius: "8px",
          borderLeft: "3px solid var(--warning)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: "700",
              color: "white",
              background: "var(--warning)",
              padding: "2px 6px",
              borderRadius: "4px",
              flexShrink: 0,
            }}
          >
            ✏️ MODIFIÉ
          </span>
          <span
            style={{
              fontSize: "12.5px",
              fontWeight: "600",
              color: "var(--gray-800)",
            }}
          >
            {diff.description || diff.oldDescription}
          </span>
        </div>

        {diff.prixChanged && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              paddingLeft: "4px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--gray-500)" }}>
              Prix :
            </span>
            <span
              style={{
                fontSize: "11.5px",
                color: "var(--gray-500)",
                textDecoration: "line-through",
              }}
            >
              {Number(diff.oldPrix || 0).toFixed(2)} DT
            </span>
            <span
              style={{
                color: "var(--gray-400)",
                fontWeight: "700",
                fontSize: "11px",
              }}
            >
              →
            </span>
            <strong style={{ fontSize: "12px", color: "var(--gray-800)" }}>
              {Number(diff.newPrix || 0).toFixed(2)} DT
            </strong>
          </div>
        )}

        {diff.descChanged && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              paddingLeft: "4px",
            }}
          >
            <div style={{ fontSize: "11px", color: "var(--gray-500)" }}>
              Description :
            </div>
            <span
              style={{
                fontSize: "11.5px",
                color: "var(--gray-500)",
                textDecoration: "line-through",
              }}
            >
              {diff.oldDescription}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "var(--gray-800)",
                fontWeight: "600",
              }}
            >
              {diff.description}
            </span>
          </div>
        )}

        {diff.decisionChanged && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              paddingLeft: "4px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--gray-500)" }}>
              Décision :
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "8px",
                color: oldDec.color,
                background: oldDec.bg,
              }}
            >
              {oldDec.icon} {oldDec.label}
            </span>
            <span
              style={{
                color: "var(--gray-400)",
                fontWeight: "700",
                fontSize: "11px",
              }}
            >
              →
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "8px",
                color: newDec.color,
                background: newDec.bg,
              }}
            >
              {newDec.icon} {newDec.label}
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default ReparationDetail;