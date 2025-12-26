import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Enforce type-safe error handling - prevents unsafe usage of `any` typed values
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn"
      // Ban React.FC and FC - use direct function declarations instead
      "@typescript-eslint/ban-types": [
        "error",
        {
          types: {
            "React.FC": {
              message: "Use direct function declarations instead. See docs/DESIGN_SYSTEM.md#coding-standards",
              fixWith: "function ComponentName(props: Props) { ... }"
            },
            "React.FunctionComponent": {
              message: "Use direct function declarations instead. See docs/DESIGN_SYSTEM.md#coding-standards",
              fixWith: "function ComponentName(props: Props) { ... }"
            },
            "FC": {
              message: "Use direct function declarations instead. See docs/DESIGN_SYSTEM.md#coding-standards",
              fixWith: "function ComponentName(props: Props) { ... }"
            },
            "FunctionComponent": {
              message: "Use direct function declarations instead. See docs/DESIGN_SYSTEM.md#coding-standards",
              fixWith: "function ComponentName(props: Props) { ... }"
            }
          },
          extendDefaults: true
        }
      ],
    },
  }
);
