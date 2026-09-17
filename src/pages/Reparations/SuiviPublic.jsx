import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  FaTools, FaUser, FaCalendarAlt, FaMoneyBillWave, FaHourglassHalf,
  FaCheckCircle, FaClock, FaExclamationTriangle, FaPhone, FaSearch,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SuiviPublic = () => {
  const { numero } = useParams();
  const [reparation, setReparation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReparation();
  }, [numero]);

  const loadReparation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/reparations/public/${numero}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Réparation non trouvée");
      }

      setReparation(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    !date ? "-" : new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatDateTime = (date) =>
    !date ? "-" : new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatMoney = (amount) => `${(amount || 0).toFixed(2)} DT`;

  // ✅ Mapping des libellés de panne
  const panneLabels = {
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

  // ✅ Détection du statut terminé
  const isTermine = (label) => {
    if (!label) return false;
    const l = label.toLowerCase();
    return l.includes("REPARE") || l.includes("SORTIE REPARE") || l.includes("prêt");
  };

  const isEnCours = (label) => {
    if (!label) return false;
    const l = label.toLowerCase();
    return l.includes("EN COURS") || l.includes("réparation");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)",
        padding: "20px",
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner-modern" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: "14px" }}>Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)",
        padding: "20px",
      }}>
        <div style={{
          maxWidth: "500px",
          width: "100%",
          background: "white",
          padding: "40px 30px",
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}>
          <div style={{
            width: "70px", height: "70px", borderRadius: "50%",
            background: "#fee2e2", color: "#dc2626",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: "28px",
          }}>
            <FaExclamationTriangle />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
            Réparation introuvable
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
            Le numéro <strong>{numero}</strong> n'existe pas ou a été supprimé.
          </p>
          <a
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", background: "#4361ee", color: "white",
              borderRadius: "10px", textDecoration: "none",
              fontWeight: "600", fontSize: "14px",
            }}
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)",
      padding: "20px 16px 40px",
    }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        
        {/* HEADER */}
        <div style={{
          background: "linear-gradient(135deg, #4361ee, #3a52c9)",
          color: "white",
          padding: "28px 24px",
          borderRadius: "20px",
          marginBottom: "16px",
          boxShadow: "0 12px 24px rgba(67, 97, 238, 0.3)",
          textAlign: "center",
        }}>
          <div style={{
            width: "70px", height: "70px", borderRadius: "20px",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: "28px",
            backdropFilter: "blur(10px)",
          }}>
            <FaTools />
          </div>
          <div style={{
            fontSize: "11px", fontWeight: "700",
            textTransform: "uppercase", letterSpacing: "1px",
            opacity: 0.85, marginBottom: "6px",
          }}>
            Suivi de réparation
          </div>
          <h1 style={{
            fontSize: "28px", fontWeight: "800",
            margin: 0, fontFamily: "monospace", letterSpacing: "1px",
          }}>
            {reparation.numero}
          </h1>
          <p style={{ fontSize: "12.5px", marginTop: "8px", opacity: 0.9 }}>
            Déposé le {formatDateTime(reparation.dateReception)}
          </p>
        </div>

        {/* STATUT ACTUEL */}
        <div style={{
          background: "white",
          padding: "24px",
          borderRadius: "20px",
          marginBottom: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "16px", paddingBottom: "12px",
            borderBottom: "1px solid #e5e7eb",
          }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: isTermine(reparation.status?.label)
                ? "#d1fae5"
                : isEnCours(reparation.status?.label)
                  ? "#dbeafe"
                  : "#fef3c7",
              color: isTermine(reparation.status?.label)
                ? "#059669"
                : isEnCours(reparation.status?.label)
                  ? "#2563eb"
                  : "#d97706",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isTermine(reparation.status?.label) ? (
                <FaCheckCircle size={14} />
              ) : isEnCours(reparation.status?.label) ? (
                <FaClock size={14} />
              ) : (
                <FaHourglassHalf size={14} />
              )}
            </div>
            <h2 style={{
              fontSize: "13px", fontWeight: "700", color: "#374151",
              margin: 0, textTransform: "uppercase", letterSpacing: "0.5px",
            }}>
              Statut actuel
            </h2>
          </div>

          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              padding: "14px 24px", borderRadius: "14px",
              background: reparation.status?.color || "#64748b",
              color: "white",
              fontSize: "16px", fontWeight: "800",
              boxShadow: `0 8px 20px ${reparation.status?.color || "#64748b"}40`,
            }}>
              {isTermine(reparation.status?.label) && <FaCheckCircle />}
              {isEnCours(reparation.status?.label) && <FaClock />}
              {!isTermine(reparation.status?.label) && !isEnCours(reparation.status?.label) && <FaHourglassHalf />}
              {reparation.status?.label}
            </div>

            {isTermine(reparation.status?.label) && (
              <p style={{
                fontSize: "13px", color: "#059669",
                fontWeight: "600", marginTop: "16px", marginBottom: 0,
              }}>
                ✅ Votre appareil est prêt à être récupéré
              </p>
            )}
            {isEnCours(reparation.status?.label) && (
              <p style={{
                fontSize: "13px", color: "#2563eb",
                fontWeight: "600", marginTop: "16px", marginBottom: 0,
              }}>
                ⏳ Réparation en cours...
              </p>
            )}
            {!isTermine(reparation.status?.label) && !isEnCours(reparation.status?.label) && (
              <p style={{
                fontSize: "13px", color: "#d97706",
                fontWeight: "600", marginTop: "16px", marginBottom: 0,
              }}>
                ⏳ En attente de traitement
              </p>
            )}
          </div>
        </div>

        {/* APPAREIL */}
        <div style={{
          background: "white", padding: "20px",
          borderRadius: "20px", marginBottom: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}>
          <h3 style={{
            fontSize: "12.5px", fontWeight: "700", color: "#374151",
            margin: "0 0 14px 0", textTransform: "uppercase",
            letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <FaTools size={12} /> Appareil
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Row label="Type" value={reparation.objet} />
            <Row label="Catégorie" value={reparation.categorie} />
            <Row label="Marque / Modèle" value={`${reparation.marque || ""} ${reparation.modele || ""}`.trim()} />
            {reparation.numeroSerie && (
              <Row label="IMEI" value={reparation.numeroSerie} mono />
            )}
          </div>
        </div>

        {/* PANNE */}
        <div style={{
          background: "white", padding: "20px",
          borderRadius: "20px", marginBottom: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}>
          <h3 style={{
            fontSize: "12.5px", fontWeight: "700", color: "#374151",
            margin: "0 0 14px 0", textTransform: "uppercase",
            letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <FaExclamationTriangle size={12} /> Panne signalée
          </h3>

          <div style={{
            padding: "14px 16px", background: "#fef3c7",
            borderRadius: "10px", borderLeft: "4px solid #f59e0b",
            fontSize: "14px", color: "#78350f", fontWeight: "600",
            marginBottom: "12px",
          }}>
            {panneLabels[reparation.panneType] || reparation.panneType}
          </div>

          {reparation.problemeDeclare && (
            <>
              <div style={{
                fontSize: "10.5px", fontWeight: "700", color: "#6b7280",
                textTransform: "uppercase", letterSpacing: "0.3px",
                marginBottom: "8px",
              }}>
                Description
              </div>
              <div style={{
                padding: "12px 16px", background: "#f9fafb",
                borderRadius: "10px", fontSize: "13px",
                color: "#4b5563", lineHeight: 1.6,
              }}>
                {reparation.problemeDeclare}
              </div>
            </>
          )}
        </div>

        {/* DATES */}
        <div style={{
          background: "white", padding: "20px",
          borderRadius: "20px", marginBottom: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}>
          <h3 style={{
            fontSize: "12.5px", fontWeight: "700", color: "#374151",
            margin: "0 0 14px 0", textTransform: "uppercase",
            letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <FaCalendarAlt size={12} /> Dates
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Row label="Reçu le" value={formatDate(reparation.dateReception)} />
            {reparation.datePrevisionnelle && (
              <Row label="Prévu le" value={formatDate(reparation.datePrevisionnelle)} />
            )}
            {reparation.dateFinReelle && (
              <Row label="Réparé le" value={formatDate(reparation.dateFinReelle)} success />
            )}
            {reparation.dateLivraison && (
              <Row label="Livré le" value={formatDate(reparation.dateLivraison)} success />
            )}
          </div>
        </div>

        {/* PAIEMENT */}
        <div style={{
          background: "white", padding: "20px",
          borderRadius: "20px", marginBottom: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}>
          <h3 style={{
            fontSize: "12.5px", fontWeight: "700", color: "#374151",
            margin: "0 0 14px 0", textTransform: "uppercase",
            letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <FaMoneyBillWave size={12} /> Paiement
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Row label="Prix de base" value={formatMoney(reparation.prix)} />

            {reparation.imprevusAcceptes?.length > 0 && (
              <div style={{
                padding: "12px 14px", background: "#d1fae5",
                borderRadius: "10px", border: "1px solid #05966930",
              }}>
                <div style={{
                  fontSize: "10.5px", fontWeight: "700", color: "#059669",
                  textTransform: "uppercase", letterSpacing: "0.3px",
                  marginBottom: "8px",
                }}>
                  ✅ Imprévus acceptés
                </div>
                {reparation.imprevusAcceptes.map((imp, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: "12.5px", color: "#065f46",
                    marginBottom: i < reparation.imprevusAcceptes.length - 1 ? "4px" : 0,
                  }}>
                    <span>• {imp.description}</span>
                    <strong>+ {formatMoney(imp.prix)}</strong>
                  </div>
                ))}
              </div>
            )}

            {reparation.imprevusEnAttente > 0 && (
              <div style={{
                padding: "10px 14px", background: "#fef3c7",
                borderRadius: "10px", border: "1px solid #f59e0b30",
                fontSize: "12px", color: "#92400e", fontWeight: "600",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <FaClock size={11} />
                {reparation.imprevusEnAttente} imprévu(s) en attente de validation
              </div>
            )}

            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "12px 14px",
              background: "linear-gradient(135deg, #4361ee, #3a52c9)",
              borderRadius: "10px", marginTop: "4px",
            }}>
              <span style={{
                fontSize: "11px", fontWeight: "700", color: "white",
                textTransform: "uppercase", letterSpacing: "0.5px",
                opacity: 0.9,
              }}>
                💰 Prix total
              </span>
              <strong style={{ fontSize: "18px", fontWeight: "800", color: "white" }}>
                {formatMoney(reparation.prixTotal)}
              </strong>
            </div>

            <Row label="Acompte versé" value={`− ${formatMoney(reparation.acompte)}`} success />

            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "14px 16px",
              background: reparation.reste > 0 ? "#fee2e2" : "#d1fae5",
              borderRadius: "12px",
              border: reparation.reste > 0 ? "1px solid #dc262640" : "1px solid #05966940",
            }}>
              <span style={{
                fontSize: "11.5px", fontWeight: "700",
                color: reparation.reste > 0 ? "#dc2626" : "#059669",
                textTransform: "uppercase", letterSpacing: "0.3px",
              }}>
                Reste à payer
              </span>
              <strong style={{
                fontSize: "18px", fontWeight: "800",
                color: reparation.reste > 0 ? "#dc2626" : "#059669",
              }}>
                {formatMoney(reparation.reste)}
              </strong>
            </div>
          </div>
        </div>

        {/* RÉPARATEUR */}
        {reparation.reparateur && (
          <div style={{
            background: "white", padding: "20px",
            borderRadius: "20px", marginBottom: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}>
            <h3 style={{
              fontSize: "12.5px", fontWeight: "700", color: "#374151",
              margin: "0 0 14px 0", textTransform: "uppercase",
              letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <FaUser size={12} /> Technicien
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "linear-gradient(135deg, #4361ee, #3a52c9)",
                color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", fontWeight: "700",
              }}>
                {reparation.reparateur.firstName?.charAt(0)}
                {reparation.reparateur.lastName?.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                  {reparation.reparateur.firstName} {reparation.reparateur.lastName}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Réparateur assigné
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{
          textAlign: "center", padding: "20px",
          fontSize: "12px", color: "#94a3b8",
        }}>
          <p style={{ margin: 0 }}>
            Dernière mise à jour : {formatDateTime(reparation.updatedAt)}
          </p>
          <p style={{ margin: "6px 0 0" }}>
            Cette page est mise à jour automatiquement
          </p>
        </div>

      </div>
    </div>
  );
};

// ✅ Petit composant ligne
const Row = ({ label, value, mono, success }) => (
  <div style={{
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "6px 0",
  }}>
    <span style={{ fontSize: "12.5px", color: "#6b7280", fontWeight: "500" }}>
      {label}
    </span>
    <span style={{
      fontSize: "13px",
      color: success ? "#059669" : "#1f2937",
      fontWeight: "600",
      fontFamily: mono ? "monospace" : "inherit",
      textAlign: "right",
      maxWidth: "60%",
      wordBreak: "break-word",
    }}>
      {value || "-"}
    </span>
  </div>
);

export default SuiviPublic;