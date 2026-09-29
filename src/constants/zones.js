// ============================================================
// ✅ Liste des zones
// ============================================================
export const ZONES = [
  "Bni Khira",
  "Sidi Daoued",
  "El Ghorfa",
  "Sahb El Jebel",
  "Manzel Salm",
  "Haouaria",
  "EChraf",
  "Aben",
  "Zewyet El Megeyez",
  "Bir el Jady",
  "Zougeg",
  "Menzel Temim",
  "Kélibia",
  "Hamem El Ghzez",
  "Dar Allouch",
];

// ✅ Version avec { value, label } si besoin
export const ZONES_OPTIONS = ZONES.map((z) => ({
  value: z,
  label: z,
}));