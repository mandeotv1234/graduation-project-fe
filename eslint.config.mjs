// eslint.config.js
import js from "@eslint/js";
import parser from "@typescript-eslint/parser";
import globals from "globals";
import ts from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
import stylistic from "@stylistic/eslint-plugin";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "dist/**",
      "build/**",
      "out/**",
      "node_modules/**",
      "**/*.min.js",
      ".vercel/**",
    ],
  },
  ...compat.config({
    extends: ["eslint:recommended", "next"],
  }),
  js.configs.recommended,
  {
    files: ["**/*.ts?(x)"],
    languageOptions: {
      parser,
      parserOptions: {
        project: "./tsconfig.json",

        tsconfigRootDir: new URL(".", import.meta.url),
        ecmaVersion: 2020,
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.browser,
        React: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": ts,
      prettier,
      "@stylistic": stylistic,
    },
    rules: {
      "react-hooks/rules-of-hooks": 2,
      "react-hooks/exhaustive-deps": 0,
      "react/prop-types": 0,
      "react/react-in-jsx-scope": 0,

      "no-lonely-if": 1,
      "no-trailing-spaces": 1,
      "no-multi-spaces": 1,
      "no-multiple-empty-lines": 1,
      "space-before-blocks": [1, "always"],
      "object-curly-spacing": [1, "always"],
      "array-bracket-spacing": 1,
      semi: [1, "never"],
      quotes: [1, "single", { avoidEscape: true }],
      "linebreak-style": 0,
      "no-unexpected-multiline": 2,
      "keyword-spacing": 1,
      "comma-dangle": 1,
      "comma-spacing": 1,
      "arrow-spacing": 1,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
    },
  },
];

export default eslintConfig;
