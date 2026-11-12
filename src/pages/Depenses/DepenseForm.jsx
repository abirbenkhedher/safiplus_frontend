import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { createDepense, updateDepense } from "../../api/depenses";
import { useAuth } from "../../context/AuthContext";
import { useFamilles } from "../../hooks/useFamilles";

const CATEGORIES_DIVERSE = ["Transport", "Nettoyage", "Fourniture", "Loyer", "Salaire", "Autre"];
const MODES_PAIEMENT = [
  { value: "ESPECES", label: "Espèces" },
  { value: "CHEQUE", label: "Chèque" },
  { value: "VIREMENT", label: "Virement" },
  { value: "CARTE", label: "Carte" },
];

const DepenseForm = ({ depense, onClose, onSaved }) => {
  const isEdit = !!depense;
  // ✅ Vue globale = consultation : on n'y saisit que des dépenses ADMINISTRATIVES
  // (les dépenses d'une boutique se saisissent dans la boutique)
  const { isAllBoutiques } = useAuth();
  const familles = useFamilles();

  const [form, setForm] = useState({
    type: depense?.type || "REPARATION",
    montant: depense?.montant ?? "",
    categorieDiverse: depense?.categorieDiverse || "",
    motifDiverse: depense?.motifDiverse || "",
    fournisseur: depense?.fournisseur || "",
    factureNumero: depense?.factureNumero || "",
    dateDepense: depense?.dateDepense
      ? new Date(depense.dateDepense).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    modePaiement: depense?.modePaiement || "ESPECES",
    observation: depense?.observation || "",
    // ✅ Famille concernée ("" = générale, répartie sur toutes les familles)
    famille: depense?.famille?._id || depense?.famille || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.montant || Number(form.montant) < 0) {
      setError("Montant invalide");
      return;
    }
    if (form.type === "DIVERSE" && !form.categorieDiverse) {
      setError("Veuillez choisir une catégorie diverse");
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form, montant: Number(form.montant) };
      if (!isEdit && isAllBoutiques) payload.administrative = true;
      if (isEdit) {
        await updateDepense(depense._id, payload);
      } else {
        await createDepense(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: "12px", padding: "24px",
          width: "95%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "700" }}>
            {isEdit ? "Modifier dépense" : "Nouvelle dépense"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ✅ Vue globale : affectation de la dépense */}
          {isAllBoutiques && (
            <p style={{
              fontSize: "12.5px", color: "#065f46", background: "#d1fae5",
              borderRadius: "8px", padding: "8px 12px", margin: "0 0 14px",
            }}>
              🏢 <strong>Dépense administrative</strong> (globale, toutes les boutiques).
              Pour une dépense d'une boutique, passez dans cette boutique.
            </p>
          )}

          {/* Type toggle */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            {["REPARATION", "DIVERSE"].map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => set("type", t)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: form.type === t ? "2px solid var(--primary)" : "1px solid #d1d5db",
                  background: form.type === t ? "#eff6ff" : "#fff",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  color: form.type === t ? "var(--primary)" : "#6b7280",
                }}
              >
                {t === "REPARATION" ? "🔧 Réparation" : "🚚 Diverse"}
              </button>
            ))}
          </div>

          <Field label="Montant (DT) *">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.montant}
              onChange={(e) => set("montant", e.target.value)}
              style={inputStyle}
              placeholder="4000"
            />
          </Field>

          <Field label="Famille (statistiques Bénéfice)">
            <select
              value={form.famille}
              onChange={(e) => set("famille", e.target.value)}
              style={inputStyle}
            >
              <option value="">Générale — répartie sur toutes les familles</option>
              {familles.map((f) => (
                <option key={f._id} value={f._id}>{f.nom}</option>
              ))}
            </select>
          </Field>

          {form.type === "DIVERSE" && (
            <>
              <Field label="Catégorie *">
                <select
                  value={form.categorieDiverse}
                  onChange={(e) => set("categorieDiverse", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">— Choisir —</option>
                  {CATEGORIES_DIVERSE.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Motif">
                <input
                  type="text"
                  value={form.motifDiverse}
                  onChange={(e) => set("motifDiverse", e.target.value)}
                  style={inputStyle}
                  placeholder="Livraison client #1234"
                />
              </Field>
            </>
          )}

          {form.type === "REPARATION" && (
            <>
              <Field label="Fournisseur">
                <input
                  type="text"
                  value={form.fournisseur}
                  onChange={(e) => set("fournisseur", e.target.value)}
                  style={inputStyle}
                  placeholder="Tech Parts"
                />
              </Field>
              <Field label="N° Facture">
                <input
                  type="text"
                  value={form.factureNumero}
                  onChange={(e) => set("factureNumero", e.target.value)}
                  style={inputStyle}
                  placeholder="F-2024-001"
                />
              </Field>
            </>
          )}

          <Field label="Date">
            <input
              type="date"
              value={form.dateDepense}
              onChange={(e) => set("dateDepense", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Mode de paiement">
            <select
              value={form.modePaiement}
              onChange={(e) => set("modePaiement", e.target.value)}
              style={inputStyle}
            >
              {MODES_PAIEMENT.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Observation">
            <textarea
              value={form.observation}
              onChange={(e) => set("observation", e.target.value)}
              style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
              placeholder="Remarques éventuelles..."
            />
          </Field>

          {error && (
            <div style={{ color: "#ef4444", fontSize: "13px", marginBottom: "12px", padding: "8px", background: "#fef2f2", borderRadius: "6px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 18px", border: "1px solid #d1d5db", background: "#fff",
                borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px",
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 18px", background: "var(--primary)", color: "#fff",
                border: "none", borderRadius: "8px", cursor: saving ? "not-allowed" : "pointer",
                fontWeight: "600", fontSize: "13px", opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: "12px" }}>
    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
      {label}
    </label>
    {children}
  </div>
);

export default DepenseForm;