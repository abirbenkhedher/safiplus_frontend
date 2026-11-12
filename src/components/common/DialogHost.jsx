import { useEffect, useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { enregistrerDialogHost } from '../../utils/dialog';

// ============================================================
// ✅ Affiche les boîtes demandées par utils/dialog.js, une à la fois,
//    avec le composant ConfirmDialog (même design partout).
// ============================================================
const DialogHost = () => {
  const [file, setFile] = useState([]);
  const courant = file[0] || null;
  const timer = useRef(null);

  useEffect(() => enregistrerDialogHost((req) => setFile((f) => [...f, req])), []);

  const fermer = (resultat) => {
    clearTimeout(timer.current);
    setFile((f) => {
      const [premier, ...reste] = f;
      if (premier) premier.resolve(resultat);
      return reste;
    });
  };

  // Fermeture automatique (ex. avertissement d'inactivité)
  useEffect(() => {
    if (!courant?.timeoutMs) return undefined;
    timer.current = setTimeout(() => fermer(courant.kind === 'prompt' ? null : false), courant.timeoutMs);
    return () => clearTimeout(timer.current);
  }, [courant]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!courant) return null;
  const annulation = courant.kind === 'prompt' ? null : courant.kind === 'alert' ? undefined : false;

  return (
    <ConfirmDialog
      show
      title={courant.title}
      message={courant.message}
      confirmText={courant.confirmText}
      cancelText={courant.cancelText}
      variant={courant.variant}
      input={courant.input || null}
      hideCancel={courant.kind === 'alert'}
      onClose={() => fermer(annulation)}
      onConfirm={(valeur) => fermer(courant.kind === 'prompt' ? valeur : courant.kind === 'alert' ? undefined : true)}
    />
  );
};

export default DialogHost;
