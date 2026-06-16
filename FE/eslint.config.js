// FE ESLint 9 (flat config). CI 에서 `npm run lint` 가 호출하는 진입점.
//
// 정책
//  - 빌드 산출물(dist), 외부 모듈은 무시
//  - React Hooks 규칙은 켜둠 (실수 잡아주는 핵심)
//  - 외부 라이브러리(toss SDK 등) 와 supertest 류로 발생하는 unsafe-* 류 노이즈는 끔
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'eslint.config.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2022 },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
);
