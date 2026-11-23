import { useState } from "react";
import { FaExclamationTriangle, FaLock, FaTimes } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

// ============================================================
// ✅ Bandeau d'abonnement (organisation de l'utilisateur connecté)
//   bientot  : fin dans 7 jours ou moins (masquable pour la session)
//   grace    : expiré, 7 jours de grâce (tout fonctionne)
//   suspendu : lecture seule
// ============================================================
const dateFr = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "");
const CLE = "abonnementBandeauMasque";

const AbonnementBanner = () => {
  const { user } = useAuth();
  const a = user?.organisation?.abonnement;
  const [masque, setMasque] = useState(() => {
    try { return sessionStorage.getItem(CLE) === String(a?.dateFin); } catch { return false; }
  });
  if (!a || !["bientot", "grace", "suspendu"].includes(a.statut)) return null;
  if (a.statut === "bientot" && masque) return null;

  const grave = a.statut !== "bientot";
  const jours = Math.abs(a.joursRestants || 0);
  const texte = {
    bientot: `Votre abonnement « ${a.offreLibelle} » se termine le ${dateFr(a.dateFin)} (dans ${jours} jour${jours > 1 ? "s" : ""}). Pensez à le renouveler.`,
    grace: `Votre abonnement a expiré le ${dateFr(a.dateFin)}. L'application passera en lecture seule le ${dateFr(a.finGrace)} : renouvelez-le dès maintenant.`,
    suspendu: `Abonnement expiré depuis le ${dateFr(a.dateFin)} : l'application est en lecture seule (consultation et exports uniquement). Contactez votre fournisseur pour le renouveler.`,
  }[a.statut];

  return (
    <div role="alert" style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", margin: "0 0 14px",
      borderRadius: 10, fontSize: 13, fontWeight: 500,
      background: grave ? "var(--danger-light, #fee2e2)" : "var(--warning-light, #fef3c7)",
      color: grave ? "var(--danger, #b91c1c)" : "#92400e",
      border: `1px solid ${grave ? "#fca5a5" : "#fcd34d"}`,
    }}>
      {a.statut === "suspendu" ? <FaLock /> : <FaExclamationTriangle />}
      <span style={{ flex: 1 }}>{texte}</span>
      {a.statut === "bientot" && (
        <button type="button" aria-label="Masquer" title="Masquer jusqu'à la prochaine connexion"
          style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer" }}
          onClick={() => { try { sessionStorage.setItem(CLE, String(a.dateFin)); } catch { /* ignoré */ } setMasque(true); }}>
          <FaTimes />
        </button>
      )}
    </div>
  );
};

export default AbonnementBanner;
