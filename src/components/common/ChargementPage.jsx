// ✅ Affiché pendant le téléchargement d'une page (chargement à la demande)
const ChargementPage = () => (
  <div style={{ padding: "60px 16px", textAlign: "center" }} role="status" aria-live="polite">
    <div className="spinner-modern" style={{ margin: "0 auto" }}></div>
    <p style={{ marginTop: 14, color: "var(--gray-500)", fontSize: 13 }}>Chargement…</p>
  </div>
);

export default ChargementPage;
