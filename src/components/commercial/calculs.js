// ============================================================
// ✅ Gestion commerciale : calculs (identiques au serveur) et formatage
// ============================================================

/** Même calcul que le serveur (DocumentVente.calculer), au millime. */
export const calcLigne = (l, prixSaisis) => {
  const t = Number(l.tauxTVA) || 0;
  const r = Number(l.remisePct) || 0;
  const brut = Math.round(Number(l.prixUnitaire || 0) * 1000 * Number(l.quantite || 0));
  const net = Math.round(brut * (1 - r / 100));
  let ht; let tva;
  if (prixSaisis === "TTC") { ht = Math.round(net / (1 + t / 100)); tva = net - ht; }
  else { ht = net; tva = Math.round((ht * t) / 100); }
  return { ht: ht / 1000, tva: tva / 1000, ttc: (ht + tva) / 1000 };
};

export const calcTotaux = (lignes, prixSaisis, timbre = 0) => {
  let ht = 0; let tva = 0;
  (lignes || []).forEach((l) => {
    const c = calcLigne(l, prixSaisis);
    ht += Math.round(c.ht * 1000); tva += Math.round(c.tva * 1000);
  });
  const t = Math.round(Number(timbre || 0) * 1000);
  return { ht: ht / 1000, tva: tva / 1000, ttc: (ht + tva) / 1000, net: (ht + tva + t) / 1000 };
};

export const clientLabel = (c) => (c ? [c.code, c.nom, c.phone].filter(Boolean).join(" · ") : "");

// ------------------------------------------------------------
// Montant en lettres (dinars / millimes)
// ------------------------------------------------------------
const U = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze",
  "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const D = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

const moinsDeCent = (n) => {
  if (n < 20) return U[n];
  const d = Math.floor(n / 10); const u = n % 10;
  if (d === 7 || d === 9) return `${D[d]}${d === 7 && u === 1 ? " et " : "-"}${U[10 + u]}`;
  if (u === 0) return d === 8 ? "quatre-vingts" : D[d];
  if (u === 1 && d !== 8) return `${D[d]} et un`;
  return `${D[d]}-${U[u]}`;
};
const moinsDeMille = (n) => {
  const c = Math.floor(n / 100); const r = n % 100;
  let s = "";
  if (c === 1) s = "cent";
  else if (c > 1) s = `${U[c]} cent${r === 0 ? "s" : ""}`;
  if (r) s = `${s ? `${s} ` : ""}${moinsDeCent(r)}`;
  return s || "zéro";
};
export const nombreEnLettres = (n) => {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "zéro";
  const parts = [];
  const mil = Math.floor(n / 1e6); const k = Math.floor((n % 1e6) / 1000); const r = n % 1000;
  if (mil) parts.push(`${moinsDeMille(mil)} million${mil > 1 ? "s" : ""}`);
  if (k) parts.push(k === 1 ? "mille" : `${moinsDeMille(k).replace(/cents$/, "cent")} mille`);
  if (r) parts.push(moinsDeMille(r));
  return parts.join(" ");
};
export const montantEnLettres = (v) => {
  const m = Math.round(Math.abs(Number(v) || 0) * 1000);
  const dinars = Math.floor(m / 1000); const millimes = m % 1000;
  let s = `${nombreEnLettres(dinars)} dinar${dinars > 1 ? "s" : ""}`;
  if (millimes) s += ` et ${nombreEnLettres(millimes)} millime${millimes > 1 ? "s" : ""}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
};
