import globals from "globals";
import js from "@eslint/js";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import reactJsxRuntime from "eslint-plugin-react/configs/jsx-runtime.js";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,
  reactRecommended,
  reactJsxRuntime,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];