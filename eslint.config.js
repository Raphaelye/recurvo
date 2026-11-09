// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Edge Functions run on Deno, with their own imports (supabase/functions/*/deno.json).
    ignores: ['dist/*', 'supabase/functions/*'],
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: { globals: { __dirname: 'readonly' } },
  },
  {
    // react-three-fiber. Its JSX props are three.js properties (TypeScript checks
    // them), and the render loop mutates three.js materials and uniforms every
    // frame by design, which the React Compiler rules cannot model.
    files: ['src/components/three/**/*.tsx'],
    rules: {
      'react/no-unknown-property': 'off',
      'react-hooks/immutability': 'off',
    },
  },
]);
