import { useSyncExternalStore } from "react";

// ============================================================
// ✅ Espace de travail affiché : "atelier" (réparations) ou "commerce"
// Préférence du navigateur (aucune donnée métier) ; les données restent
// communes (clients, stock, dépenses, caisse).
// ============================================================
const KEY = "espaceActif";
const listeners = new Set();

export const ESPACES = { atelier: "Atelier", commerce: "Commerce" };

export const getEspace = () => {
  try { return localStorage.getItem(KEY) === "commerce" ? "commerce" : "atelier"; } catch { return "atelier"; }
};

export const setEspace = (v) => {
  const val = v === "commerce" ? "commerce" : "atelier";
  if (val === getEspace()) return;
  try { localStorage.setItem(KEY, val); } catch { /* stockage indisponible */ }
  listeners.forEach((l) => l());
};

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

/** Espace mémorisé (réactif). Utiliser useEspaceActif (AuthContext) pour l'espace effectif. */
export const useEspaceMemorise = () => useSyncExternalStore(subscribe, getEspace, () => "atelier");

// Permissions qui donnent accès à chaque espace
export const PERMS_COMMERCE = ["ventes", "ventes:read", "reglements", "comptoir", "caisse", "rapport_commercial"];
export const PERMS_ATELIER = [
  "dashboard", "mon_dashboard", "reparations", "statistiques", "rapports", "remuneration", "remuneration_autrui",
  "clotures", "achats", "stock", "stock:read", "clients", "depenses", "parametres_atelier",
];

// Pages propres à chaque espace (bascule automatique quand on y arrive par un lien)
export const PAGES_COMMERCE = ["/commerce", "/comptoir", "/ventes", "/reglements", "/caisse", "/rapport-commercial"];
export const PAGES_ATELIER = [
  "/dashboard", "/mon-tableau-de-bord", "/reparations", "/statistiques", "/rapports", "/remuneration", "/ma-remuneration", "/clotures",
  "/pannes", "/statuses",
];
export const pageDe = (pathname, liste) => liste.some((p) => pathname === p || pathname.startsWith(`${p}/`));
