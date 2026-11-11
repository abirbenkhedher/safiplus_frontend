// ============================================================
// ✅ Libellés de statut normalisés (même règle que le backend :
//    safiplus_backend/src/utils/statutReparation.js)
// "Sortie - Réparée" → "SORTIE REPARE"
// ============================================================
export const normalizeStatusLabel = (label) =>
  String(label || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\bREPAREES?\b|\bREPARES\b|\bREPARE E\b/g, "REPARE")
    .replace(/\bSORTIES?\b|\bSORTI\b/g, "SORTIE")
    .replace(/\s+/g, " ")
    .trim();

const STATUTS_CLOTURE = ["REPARE", "SAV REPARE", "SORTIE REPARE", "SAV SORTIE REPARE"];

/** Statut qui clôture la réparation quand le reste à payer est 0. */
export const isStatutCloture = (label) => {
  const n = normalizeStatusLabel(label);
  if (STATUTS_CLOTURE.includes(n)) return true;
  const t = n.split(" ");
  return t.includes("SORTIE") && t.includes("REPARE") && !t.includes("NON");
};
