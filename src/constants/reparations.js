

// ✅ Types de paiement
export const PAYMENT_TYPES = [
  { value: 'unpaid', label: 'Non payé', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
  { value: 'partial', label: 'Acompte versé', color: '#f59e0b', bg: '#fef3c7', icon: '◐' },
  { value: 'paid', label: 'Payé', color: '#10b981', bg: '#d1fae5', icon: '✅' },
];

// ✅ Clés de stockage local

// ✅ Réduire le TTL pour limiter les risques de cache périmé
export const REF_CACHE_KEY = 'reparations_ref_cache_v2'; // ✅ bump version
export const REF_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export const DRAFT_KEY = 'reparation_draft';