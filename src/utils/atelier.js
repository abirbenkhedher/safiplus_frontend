import { useState } from "react";

// ✅ Helpers du module atelier (formatage, dates, période)

const pad = (n) => String(n).padStart(2, "0");
/** Montant en TND au millime. */
export const tnd = (v) =>
  v === null || v === undefined || v === ""
    ? "—"
    : `${Number(v).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND`;

export const dateFr = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

export const userName = (u) => (u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username : "—");

export const errMsg = (e) => e?.response?.data?.message || e?.message || "Erreur";

export const isoDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const isoMonth = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/** Période (du 1er du mois à la fin du mois par défaut). */
export const usePeriode = () => {
  const now = new Date();
  const [range, setRange] = useState({
    from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: isoDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  });
  return [range, setRange];
};

/** Demande un motif (annulation, réouverture). Renvoie null si annulé. */
export const askMotif = (question = "Motif (obligatoire) :") => {
  const m = window.prompt(question);
  return m && m.trim() ? m.trim() : null;
};

/** Libellé lisible d'une ligne de stock (article). */
export const articleLabel = (s) =>
  s ? [s.code, s.typeArticle?.nom, s.marque?.nom, s.modele?.nom, s.objet?.nom].filter(Boolean).join(" · ") || s._id : "—";

