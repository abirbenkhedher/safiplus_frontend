// ============================================================
// ✅ MULTI-TENANT : boutique active (mémorisée dans le navigateur)
// Valeur : id d'une boutique ('' = aucune : écran de choix / backoffice)
// ============================================================
const KEY = 'activeBoutique';

export const getActiveBoutique = () => {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
};

export const setActiveBoutique = (value) => {
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible */
  }
};

export const clearActiveBoutique = () => setActiveBoutique('');

/**
 * Boutique active valide pour l'utilisateur (garde la précédente si possible).
 *  - une seule boutique → choisie automatiquement
 *  - plusieurs          → '' tant que l'utilisateur n'a pas choisi (écran de choix)
 *  - SUPER_ADMIN        → '' = backoffice
 */
export const ALL_BOUTIQUES = 'all';

/** Vue globale (toutes les boutiques) : réservée à l'admin ayant plusieurs boutiques. */
export const canUseGlobalView = (user) =>
  user?.role === 'ADMIN' && (user?.boutiquesAccessibles || []).length > 1;

export const resolveActiveBoutique = (user) => {
  const list = user?.boutiquesAccessibles || [];
  const current = getActiveBoutique();
  if (current === ALL_BOUTIQUES && canUseGlobalView(user)) return current;
  if (list.some((b) => b._id === current)) return current;
  if (user?.role !== 'SUPER_ADMIN' && list.length === 1) return list[0]._id;
  return '';
};

/** En-tête HTTP à joindre aux requêtes API. */
export const applyBoutiqueHeader = (config) => {
  const active = getActiveBoutique();
  if (active) config.headers['X-Boutique-Id'] = active;
  return config;
};

// ============================================================
// ✅ VUE GLOBALE = CONSULTATION
// Ajout / modification des données des boutiques interdits (le serveur
// répond GLOBAL_READONLY). On affiche un avertissement qui propose de
// passer dans une boutique.
// ============================================================
let noticeHandler = null;

/** Enregistré par <GlobalViewNotice /> : (message?) => void */
export const registerGlobalViewNotice = (fn) => {
  noticeHandler = fn;
  return () => {
    if (noticeHandler === fn) noticeHandler = null;
  };
};

export const isGlobalView = () => getActiveBoutique() === ALL_BOUTIQUES;

/**
 * À appeler avant d'ouvrir un formulaire d'ajout / modification.
 * Retourne true (et affiche l'avertissement) si on est en vue globale.
 */
export const blockInGlobalView = (message) => {
  if (!isGlobalView()) return false;
  if (noticeHandler) noticeHandler(message);
  return true;
};

const isGlobalRefusal = (error) => {
  const data = error.response?.data || {};
  if (data.code === 'GLOBAL_READONLY' || data.code === 'BOUTIQUE_REQUIRED') return true;
  const msg = typeof data.message === 'string' ? data.message : '';
  return /vue globale|s[ée]lectionner une boutique/i.test(msg);
};

/** Intercepteur de réponse : avertissement si refus « vue globale ». */
export const handleGlobalViewRefusal = (error) => {
  if (!isGlobalView() || !noticeHandler || !isGlobalRefusal(error)) return;
  noticeHandler(error.response?.data?.message);
};

/** Gère les refus liés à la boutique (boutique retirée, désactivée...). */
export const handleBoutiqueError = (error) => {
  const code = error.response?.data?.code;
  if (error.response?.status === 403 && code === 'BOUTIQUE_FORBIDDEN') {
    clearActiveBoutique();
    window.location.reload();
    return true;
  }
  return false;
};
