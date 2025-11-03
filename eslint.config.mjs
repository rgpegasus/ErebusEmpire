import eslintPluginPerfectionist from 'eslint-plugin-perfectionist'

export default [
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  eslint,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh,
      'perfectionist': eslintPluginPerfectionist
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,
      // règles Perfectionist
      'perfectionist/sort-imports': ['error', { type: 'natural' }],
      'perfectionist/sort-objects': ['error', { type: 'asc' }],
      'perfectionist/sort-jsx-props': ['error', { type: 'asc' }]
    }
  },
  eslintConfigPrettier
]
