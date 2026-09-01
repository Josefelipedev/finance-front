import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  /**
   * A listagem de lançamentos passa toda pelo `getAllFinances` (T5.4).
   *
   * `/finance` é paginado e o servidor assume **50** quando não se lhe pede
   * limite. Quem chamar a rota à mão para SOMAR fica pela primeira página e o
   * ecrã mostra menos dinheiro do que existe — enquanto o dashboard, que soma
   * no servidor, mostra o total certo. Já aconteceu, em cinco ecrãs ao mesmo
   * tempo, e o número mais baixo é o que parece inofensivo.
   *
   * O `getAllFinances` percorre as páginas todas; é o único sítio autorizado a
   * falar com a rota. Não há testes na web para amarrar isto, por isso amarra-o
   * o lint, que já corre.
   */
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/hooks/useFinance.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='api'][callee.property.name='get'] > Literal[value='/finance']",
          message:
            'Para somar lançamentos usa getAllFinances() do useFinance — /finance é paginado e a chamada direta fica pela primeira página (T5.4).',
        },
      ],
    },
  }
);
