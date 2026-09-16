// ✅ Liste standardisée des pannes
export const PANNES_STANDARD = [
  { value: 'lcd', label: 'Écran (LCD)', category: 'Écran', icon: '📱' },
  { value: 'touch', label: 'Tactile / Vitre', category: 'Écran', icon: '👆' },
  { value: 'battery', label: 'Batterie', category: 'Alimentation', icon: '🔋' },
  { value: 'charging_port', label: 'Connecteur de charge', category: 'Alimentation', icon: '⚡' },
  { value: 'camera_front', label: 'Caméra frontale', category: 'Photo', icon: '📷' },
  { value: 'camera_back', label: 'Caméra arrière', category: 'Photo', icon: '📸' },
  { value: 'speaker', label: 'Haut-parleur', category: 'Audio', icon: '🔊' },
  { value: 'microphone', label: 'Microphone', category: 'Audio', icon: '🎤' },
  { value: 'headphone', label: 'Jack audio', category: 'Audio', icon: '🎧' },
  { value: 'button_power', label: 'Bouton Power', category: 'Boutons', icon: '🔘' },
  { value: 'button_volume', label: 'Boutons volume', category: 'Boutons', icon: '🎚️' },
  { value: 'software', label: 'Logiciel / Système', category: 'Logiciel', icon: '💾' },
  { value: 'water_damage', label: 'Dégât d\'eau', category: 'Autre', icon: '💧' },
  { value: 'network', label: 'Réseau / Signal', category: 'Autre', icon: '📡' },
  { value: 'other', label: 'Autre', category: 'Autre', icon: '❓' },
];

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