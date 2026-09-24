

// ✅ Types de paiement
export const PAYMENT_TYPES = [
  { value: 'unpaid', label: 'Non payé', color: '#ef4444', bg: '#fee2e2', icon: '❌' },
  { value: 'partial', label: 'Acompte versé', color: '#f59e0b', bg: '#fef3c7', icon: '◐' },
  { value: 'paid', label: 'Payé', color: '#10b981', bg: '#d1fae5', icon: '✅' },
];

// ✅ Clés de stockage local
export const DRAFT_KEY = 'reparation_draft';
export const REF_CACHE_KEY = 'reparation_ref_cache';
export const REF_CACHE_TTL = 5 * 60 * 1000; // 5 minutes