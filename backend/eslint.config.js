import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
	{ ignores: ["*.js"] },
	eslint.configs.recommended,
	tseslint.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/explicit-function-return-type": [
				"warn",
				{ allowExpressions: true },
			],
			"@typescript-eslint/restrict-plus-operands": [
				"error",
				{ allowNullish: false },
			],
			"@typescript-eslint/restrict-template-expressions": [
				"error",
				{ allow: [], allowNullish: false },
			],
			"@typescript-eslint/no-misused-promises": "off", // "let me abuse promises in peace"
			"@typescript-eslint/no-unsafe-enum-comparison": "off",
			"@typescript-eslint/no-unsafe-assignment": "error",
			"@typescript-eslint/no-unsafe-return": "error",
			"@typescript-eslint/no-unsafe-argument": "error",
			"@typescript-eslint/no-floating-promises": [
				"error",
				{
					allowForKnownSafeCalls: [
						{
							from: "package",
							name: ["test", "suite"],
							package: "node:test",
						},
					],
				},
			],
			"@typescript-eslint/no-namespace": "off",
			"no-var": "off",
			"no-console": "warn",
			"prefer-const": "warn",
			curly: "error",
		},
	},
);
