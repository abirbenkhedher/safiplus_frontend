import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Les fichiers de contexte exportent leur Provider ET leur hook d'accès (useAuth…) : usage standard
      'react-refresh/only-export-components': ['error', {
        allowConstantExport: true,
        allowExportNames: ['useAuth', 'useReparationModal', 'useStatistiquesContext'],
      }],
      // ⚠️ Temporaire : 46 effets de chargement de données (« load() au démarrage de la page »).
      // Fonctionnent correctement, mais à réécrire page par page AVEC vérification dans le navigateur.
      // Avertissement plutôt qu'erreur pour que le lint puisse bloquer les nouvelles erreurs.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Tests unitaires (Vitest) : exécutés par Node
    files: ['**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
])
