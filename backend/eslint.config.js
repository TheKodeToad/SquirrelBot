import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
	{ files: ["**/*.{js,mjs,cjs,ts}"], plugins: { js }, extends: ["js/recommended"] },
	{ files: ["**/*.{js,mjs,cjs,ts}"], languageOptions: { globals: globals.node } },
	tseslint.configs.recommended,
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/explicit-function-return-type": ["warn", { allowExpressions: true }],
			"no-var": "off",
			"no-console": "warn",
			"prefer-const": "warn"
		}
	}
]);
