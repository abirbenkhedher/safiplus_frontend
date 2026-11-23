// ✅ Conversions HT ↔ TTC au millime (partagées par les formulaires de stock)
export const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;
export const versTTC = (ht, t) => (ht === "" || ht === null || ht === undefined ? "" : r3(Number(ht) * (1 + (Number(t) || 0) / 100)));
export const versHT = (ttc, t) => (ttc === "" || ttc === null || ttc === undefined ? "" : r3(Number(ttc) / (1 + (Number(t) || 0) / 100)));
