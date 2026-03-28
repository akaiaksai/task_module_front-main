import prettierConfig from 'eslint-config-prettier';
import pluginImport from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['node_modules/**', 'dist/**', 'build/**'] },

  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  pluginReact.configs.flat.recommended,
  prettierConfig,

  // Глобальные настройки приложения
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Настройки для файлов внутри src
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      import: pluginImport,
      'react-hooks': pluginReactHooks,
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      curly: ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'object-shorthand': ['error', 'always'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'import/no-cycle': 'error',
      'import/no-duplicates': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-definitions': 'off',
      ...tseslint.configs.recommendedTypeChecked.rules,
      ...tseslint.configs.stylisticTypeChecked.rules,

      // Варнинги на комменты
      'no-warning-comments': [
        'warn',
        { terms: ['TODO', 'FIX', 'TASK'], location: 'start' },
      ],
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
];
