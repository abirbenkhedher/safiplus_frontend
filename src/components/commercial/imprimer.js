import { TYPES_DOC, modeLabel } from "../../api/ventes";
import { calcLigne, montantEnLettres } from "./calculs";

// ============================================================
// ✅ Impression A4 d'un document de vente (fenêtre d'impression du navigateur
//    → imprimante ou « Enregistrer au format PDF »).
// ============================================================
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const m3 = (v) => Number(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const d = (v) => (v ? new Date(v).toLocaleDateString("fr-FR") : "");

/** Ticket de caisse 80 mm (imprimante thermique). */
export const imprimerTicket = (doc, { params = {}, recu = null, rendu = null } = {}) => {
  const v = doc.vendeurSnapshot?.raisonSociale || doc.vendeurSnapshot?.boutique ? doc.vendeurSnapshot : (params.commerce || {});
  const c = doc.clientSnapshot || doc.client || {};
  const lignes = (doc.lignes || []).map((l) => {
    const x = calcLigne(l, doc.prixSaisis);
    return `<tr><td colspan="2">${esc(l.designation)}</td></tr>
      <tr><td>${esc(l.quantite)} × ${m3(l.prixUnitaire)}${l.remisePct ? ` −${esc(l.remisePct)}%` : ""}</td><td class="r">${m3(x.ttc)}</td></tr>`;
  }).join("");
  const regl = (doc.reglements || []).filter((r) => r.statut !== "annule")
    .map((r) => `<tr><td>${esc(modeLabel(r.mode))}</td><td class="r">${m3(r.montantFacture ?? r.montant)}</td></tr>`).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>${esc(doc.numero || "Ticket")}</title>
<style>
  @page { size: 80mm auto; margin: 3mm; }
  body { font-family: "Courier New", monospace; font-size: 12px; width: 72mm; margin: 0 auto; color: #000; }
  .c { text-align: center; } .r { text-align: right; white-space: nowrap; }
  table { width: 100%; border-collapse: collapse; } td { padding: 1px 0; vertical-align: top; }
  hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
  .big td { font-size: 15px; font-weight: bold; }
</style></head><body>
<div class="c"><b style="font-size:14px">${esc(v.raisonSociale || v.boutique || "")}</b><br/>
${v.adresse ? `${esc(v.adresse)}<br/>` : ""}${v.telephone ? `Tél ${esc(v.telephone)}<br/>` : ""}${v.matriculeFiscal ? `MF ${esc(v.matriculeFiscal)}` : ""}</div>
<hr/>
<div>Ticket <b>${esc(doc.numero || "")}</b><br/>${doc.date ? new Date(doc.date).toLocaleString("fr-FR") : ""}${c.nom && !/comptoir/i.test(c.nom) ? `<br/>Client : ${esc(c.nom)}` : ""}</div>
<hr/>
<table>${lignes}</table>
<hr/>
<table>
  <tr><td>Total HT</td><td class="r">${m3(doc.totalHT)}</td></tr>
  <tr><td>TVA</td><td class="r">${m3(doc.totalTVA)}</td></tr>
  <tr class="big"><td>TOTAL TTC</td><td class="r">${m3(doc.netAPayer)}</td></tr>
</table>
${regl ? `<hr/><table>${regl}${recu !== null ? `<tr><td>Reçu</td><td class="r">${m3(recu)}</td></tr>` : ""}${rendu ? `<tr><td>Rendu</td><td class="r">${m3(rendu)}</td></tr>` : ""}</table>` : ""}
${doc.paiement?.reste > 0 ? `<div>Reste à payer : <b>${m3(doc.paiement.reste)}</b></div>` : ""}
<hr/><div class="c">${esc(v.piedPage || "Merci de votre visite")}</div>
<script>window.onload = function () { window.print(); };</script>
</body></html>`;
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
};

export const imprimerDocument = (doc, params = {}) => {
  const v = doc.statut === "brouillon" || !doc.vendeurSnapshot?.raisonSociale
    ? { ...(params.commerce || {}), raisonSociale: params.commerce?.raisonSociale || "" }
    : doc.vendeurSnapshot;
  const c = doc.statut === "brouillon" || !doc.clientSnapshot?.nom ? (doc.client || {}) : doc.clientSnapshot;
  const t = TYPES_DOC[doc.type] || { titre: doc.type };
  const ttc = doc.prixSaisis === "TTC";

  const lignes = (doc.lignes || []).map((l) => {
    const x = calcLigne(l, doc.prixSaisis);
    return `<tr>
      <td>${esc(l.code)}</td>
      <td>${esc(l.designation)}</td>
      <td class="r">${esc(l.quantite)}</td>
      <td class="r">${m3(l.prixUnitaire)}</td>
      <td class="r">${l.remisePct ? `${esc(l.remisePct)} %` : ""}</td>
      <td class="r">${esc(l.tauxTVA)} %</td>
      <td class="r">${m3(x.ht)}</td>
      <td class="r">${m3(x.ttc)}</td>
    </tr>`;
  }).join("");

  const tva = (doc.tvaParTaux || []).map((x) =>
    `<tr><td>${esc(x.taux)} %</td><td class="r">${m3(x.base)}</td><td class="r">${m3(x.montant)}</td></tr>`).join("");

  const regl = ["FACTURE", "TICKET"].includes(doc.type) && doc.paiement
    ? `<div class="pay">Réglé : <b>${m3(doc.paiement.regle)}</b> TND · Reste à payer : <b>${m3(doc.paiement.reste)}</b> TND
       ${(doc.reglements || []).filter((r) => r.statut === "valide").map((r) => `<br/>${d(r.date)} — ${esc(r.numero)} (${esc(modeLabel(r.mode))}${r.reference ? ` ${esc(r.reference)}` : ""}) : ${m3(r.montantFacture)} TND`).join("")}</div>`
    : "";

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
<title>${esc(t.titre)} ${esc(doc.numero || "BROUILLON")}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11.5px; color: #111; margin: 0; }
  .head { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
  .vendeur b { font-size: 15px; }
  .titre { text-align: right; }
  .titre h1 { margin: 0 0 6px; font-size: 22px; letter-spacing: 1px; }
  .box { border: 1px solid #999; border-radius: 4px; padding: 8px 10px; }
  .client { width: 48%; margin-left: auto; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #bbb; padding: 5px 6px; vertical-align: top; }
  th { background: #f1f1f1; font-weight: bold; text-align: left; }
  .r { text-align: right; white-space: nowrap; }
  .bas { display: flex; justify-content: space-between; gap: 16px; margin-top: 14px; align-items: flex-start; }
  .tva { width: 45%; }
  .tot { width: 42%; }
  .tot td:first-child { font-weight: bold; }
  .net td { font-size: 14px; font-weight: bold; background: #f1f1f1; }
  .lettres { margin-top: 14px; font-style: italic; }
  .pay { margin-top: 10px; }
  .sign { display: flex; justify-content: space-between; margin-top: 36px; }
  .sign div { width: 40%; text-align: center; border-top: 1px dashed #999; padding-top: 6px; }
  .pied { margin-top: 28px; border-top: 1px solid #ccc; padding-top: 6px; font-size: 10px; color: #444; text-align: center; }
  .wm { position: fixed; top: 40%; left: 0; right: 0; text-align: center; font-size: 90px; color: rgba(200,0,0,.12); transform: rotate(-25deg); z-index: -1; }
</style></head><body>
${doc.statut === "brouillon" ? '<div class="wm">BROUILLON</div>' : ""}
${doc.statut === "annule" ? '<div class="wm">ANNULÉ</div>' : ""}
<div class="head">
  <div class="vendeur">
    <b>${esc(v.raisonSociale || v.boutique || "")}</b><br/>
    ${v.adresse ? `${esc(v.adresse)}<br/>` : ""}
    ${v.telephone ? `Tél : ${esc(v.telephone)}<br/>` : ""}
    ${v.email ? `${esc(v.email)}<br/>` : ""}
    ${v.matriculeFiscal ? `MF : ${esc(v.matriculeFiscal)}<br/>` : ""}
    ${v.registreCommerce ? `RC : ${esc(v.registreCommerce)}` : ""}
  </div>
  <div class="titre">
    <h1>${esc(t.titre)}</h1>
    <div>N° <b>${esc(doc.numero || "—")}</b></div>
    <div>Date : ${d(doc.date)}</div>
    ${doc.type === "DEVIS" && doc.dateValidite ? `<div>Valable jusqu'au : ${d(doc.dateValidite)}</div>` : ""}
    ${doc.type === "FACTURE" && doc.dateEcheance ? `<div>Échéance : ${d(doc.dateEcheance)}</div>` : ""}
    ${doc.factureOrigine?.numero ? `<div>Sur facture : ${esc(doc.factureOrigine.numero)}</div>` : ""}
  </div>
</div>
<div class="box client">
  <b>Client :</b> ${esc(c.nom)}${c.code ? ` (${esc(c.code)})` : ""}<br/>
  ${c.adresse ? `${esc(c.adresse)}<br/>` : ""}
  ${c.phone ? `Tél : ${esc(c.phone)}<br/>` : ""}
  ${c.matriculeFiscal ? `MF : ${esc(c.matriculeFiscal)}` : ""}
</div>
<table>
  <thead><tr><th>Réf.</th><th>Désignation</th><th class="r">Qté</th><th class="r">PU ${ttc ? "TTC" : "HT"}</th><th class="r">Remise</th><th class="r">TVA</th><th class="r">Total HT</th><th class="r">Total TTC</th></tr></thead>
  <tbody>${lignes}</tbody>
</table>
<div class="bas">
  <table class="tva"><thead><tr><th>Taux TVA</th><th class="r">Base HT</th><th class="r">Montant TVA</th></tr></thead><tbody>${tva}</tbody></table>
  <table class="tot">
    <tr><td>Total HT</td><td class="r">${m3(doc.totalHT)}</td></tr>
    <tr><td>Total TVA</td><td class="r">${m3(doc.totalTVA)}</td></tr>
    ${doc.type === "FACTURE" && Number(doc.timbreFiscal) ? `<tr><td>Timbre fiscal</td><td class="r">${m3(doc.timbreFiscal)}</td></tr>` : ""}
    <tr class="net"><td>${doc.type === "AVOIR" ? "Total avoir TTC" : "Net à payer TTC"}</td><td class="r">${m3(doc.netAPayer)} TND</td></tr>
  </table>
</div>
<div class="lettres">Arrêté${doc.type === "FACTURE" ? "e la présente facture" : doc.type === "AVOIR" ? " le présent avoir" : doc.type === "DEVIS" ? " le présent devis" : doc.type === "TICKET" ? " le présent ticket" : " le présent bon"} à la somme de : <b>${esc(montantEnLettres(doc.netAPayer))}</b>.</div>
${regl}
${doc.conditionsPaiement ? `<div class="pay">Conditions : ${esc(doc.conditionsPaiement)}</div>` : ""}
${doc.observation ? `<div class="pay">${esc(doc.observation)}</div>` : ""}
${v.rib && doc.type === "FACTURE" ? `<div class="pay">RIB : ${esc(v.rib)}</div>` : ""}
<div class="sign"><div>Cachet et signature</div><div>${doc.type === "BL" ? "Reçu par le client" : doc.type === "DEVIS" ? "Bon pour accord (client)" : "Client"}</div></div>
${v.piedPage ? `<div class="pied">${esc(v.piedPage)}</div>` : ""}
<script>window.onload = function () { window.print(); };</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
};
