// ============================================================
// ✅ Gestion commerciale : calculs (identiques au serveur) et formatage
// ============================================================

// ------------------------------------------------------------
// ✅ Mêmes calculs que le serveur (DocumentVente.calculer), au millime :
//   1) remise de la ligne (% ou montant) ; 2) remise globale répartie au prorata ;
//   3) HT / TVA par ligne (base TTC : HT = net / (1+t), TVA = net − HT).
// ------------------------------------------------------------
const toM = (v) => Math.round(Number(v || 0) * 1000);

/** Net d'une ligne après SA remise (millimes, base du document). */
export const netLigneM = (l) => {
  const brut = Math.round(toM(l.prixUnitaire) * Number(l.quantite || 0));
  if (l.remiseType === "montant") return Math.max(0, brut - toM(l.remiseMontant));
  return Math.round(brut * (1 - (Number(l.remisePct) || 0) / 100));
};

/** Répartit G millimes au prorata (somme exacte, reste aux plus gros montants). */
export const repartirM = (G, montants) => {
  const total = montants.reduce((s, m) => s + m, 0);
  if (!G || total <= 0) return montants.map(() => 0);
  const parts = montants.map((m) => Math.floor((G * m) / total));
  let reste = G - parts.reduce((s, p) => s + p, 0);
  const ordre = montants.map((m, i) => i).sort((a, b) => montants[b] - montants[a]);
  for (let k = 0; reste > 0; k = (k + 1) % ordre.length) { parts[ordre[k]] += 1; reste -= 1; }
  return parts;
};

const htTva = (netM, t, prixSaisis) => {
  if (prixSaisis === "TTC") { const ht = Math.round(netM / (1 + t / 100)); return { ht, tva: netM - ht }; }
  return { ht: netM, tva: Math.round((netM * t) / 100) };
};

/** Une ligne, après sa propre remise (avant remise globale). */
export const calcLigne = (l, prixSaisis) => {
  const { ht, tva } = htTva(netLigneM(l), Number(l.tauxTVA) || 0, prixSaisis);
  return { ht: ht / 1000, tva: tva / 1000, ttc: (ht + tva) / 1000 };
};

/**
 * Totaux du document. remise = { type: "pct" | "montant", valeur }.
 * Renvoie aussi avantRemise (Σ nets) et remise (montant de la remise globale), base du document.
 */
export const calcTotaux = (lignes, prixSaisis, timbre = 0, remise = null) => {
  const ls = lignes || [];
  const nets = ls.map(netLigneM);
  const somme = nets.reduce((s, n) => s + n, 0);
  const v = Number(remise?.valeur) || 0;
  const G = remise?.type === "montant" ? Math.min(toM(v), somme) : Math.round((somme * Math.min(100, v)) / 100);
  const parts = repartirM(G, nets);
  let ht = 0; let tva = 0;
  ls.forEach((l, i) => {
    const x = htTva(nets[i] - parts[i], Number(l.tauxTVA) || 0, prixSaisis);
    ht += x.ht; tva += x.tva;
  });
  const t = toM(timbre);
  return {
    ht: ht / 1000, tva: tva / 1000, ttc: (ht + tva) / 1000, net: (ht + tva + t) / 1000,
    avantRemise: somme / 1000, remise: G / 1000,
  };
};

/** Libellé de la remise d'une ligne (« 10 % » ou « 5,000 DT »). */
export const remiseLabel = (l) => {
  if (l.remiseType === "montant") return Number(l.remiseMontant) ? `${Number(l.remiseMontant).toFixed(3)} DT` : "";
  const p = Number(l.remisePct) || 0;
  return p ? `${Math.round(p * 100) / 100} %` : "";
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

// ✅ Base des prix du commerce (caisse, devis, factures) : réglage commerce.prixTTC (TTC par défaut),
//    indépendant du réglage atelier prixTTC (réparations, commissions).
export const baseCommerce = (params) => (params?.commerce?.prixTTC === false ? "HT" : "TTC");

/** Prix d'un article (stocké dans la base atelier) converti vers la base du document. */
export const prixVersBase = (prix, params, prixSaisis, tva) => {
  const p = Number(prix) || 0;
  const sourceTTC = params?.prixTTC !== false;
  const cibleTTC = prixSaisis !== "HT";
  const t = Number(tva) || 0;
  if (sourceTTC === cibleTTC || !t) return p;
  return Math.round((cibleTTC ? p * (1 + t / 100) : p / (1 + t / 100)) * 1000) / 1000;
};
