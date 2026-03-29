import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es6,
      },
    },
    rules: {
      "indent": ["error", 2, { "SwitchCase": 1 }],
      "linebreak-style": ["error", "unix"],
      "no-trailing-spaces": 2,
      "eol-last": 2,
      "space-in-parens": ["error", "never"],
      "no-multiple-empty-lines": 1,
      "prefer-const": "error",
      "space-infix-ops": "error",
      "no-useless-escape": "off",
      "require-atomic-updates": "off",
    },
  },
  {
    files: ["spec/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.jasmine,
      },
    },
  },
];
