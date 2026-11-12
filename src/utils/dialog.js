// ============================================================
// ✅ Boîtes de dialogue de l'application (design ConfirmDialog)
// Remplacent window.confirm / window.prompt / alert :
//   if (!(await confirmer({ message: "Supprimer ?" }))) return;
//   const motif = await demander({ title: "Annulation", label: "Motif", required: true });
//   informer({ title: "Erreur", message: "...", variant: "danger" });
// Rendu par <DialogHost /> (monté une fois dans App.jsx).
// ============================================================
let afficher = null; // fourni par DialogHost
const enAttente = [];

/** Appelé par DialogHost à son montage. */
export const enregistrerDialogHost = (fn) => {
  afficher = fn;
  while (enAttente.length) fn(enAttente.shift());
  return () => {
    if (afficher === fn) afficher = null;
  };
};

const ouvrir = (opts) =>
  new Promise((resolve) => {
    const req = { ...opts, resolve };
    if (afficher) afficher(req);
    else enAttente.push(req);
  });

/** Oui / Annuler → true | false. `timeoutMs` : se ferme seule (false) après ce délai. */
export const confirmer = ({
  title = 'Confirmation', message = '', confirmText = 'Confirmer', cancelText = 'Annuler',
  variant = 'warning', timeoutMs,
} = {}) => ouvrir({ kind: 'confirm', title, message, confirmText, cancelText, variant, timeoutMs });

/** Saisie (motif, date…) → texte saisi | null si annulé. */
export const demander = ({
  title = 'Saisie', message = '', label = '', type = 'text', placeholder = '', defaultValue = '',
  required = true, confirmText = 'Valider', cancelText = 'Annuler', variant = 'warning',
} = {}) => ouvrir({
  kind: 'prompt', title, message, confirmText, cancelText, variant,
  input: { label, type, placeholder, defaultValue, required },
});

/** Message avec un seul bouton OK. */
export const informer = ({ title = 'Information', message = '', variant = 'info', confirmText = 'OK' } = {}) =>
  ouvrir({ kind: 'alert', title, message, confirmText, variant });
