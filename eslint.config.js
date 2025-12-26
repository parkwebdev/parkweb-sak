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
      // Require explicit typing on catch clause variables
      "@typescript-eslint/no-implicit-any-catch": "off", // Note: Rule removed in newer versions, use useUnknownInCatchVariables in tsconfig instead
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
