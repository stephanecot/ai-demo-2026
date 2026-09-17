// Configuration plate (flat config) d'ESLint pour les deux workspaces.
// Elle vit à la racine : `eslint src tests` lancé depuis backend/ ou frontend/
// remonte jusqu'ici pour la trouver.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Rien à analyser dans les artefacts de build, les maquettes ni l'outillage speckit.
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      'design/**',
      '.specify/**',
    ],
  },

  {
    files: ['backend/**/*.ts', 'frontend/**/*.ts', 'frontend/**/*.tsx'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    rules: {
      // Les trois interdits du contrat : pas de `any`, pas de `console.log` livré,
      // pas d'assertion non-nulle de complaisance.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Un import de type reste un import de type (verbatimModuleSyntax est actif).
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },

  // Les fichiers de configuration tournent sous Node et n'ont pas les mêmes contraintes.
  {
    files: ['*.config.js', '*/*.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
