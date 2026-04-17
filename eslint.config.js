import nextPlugin from 'eslint-config-next';

export default [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'dist/**', 'node_modules/**']
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'react/react-in-jsx-scope': 'off'
    }
  },
  nextPlugin
];
