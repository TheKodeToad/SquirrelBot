import tseslint from "typescript-eslint";

export default tseslint.config([
	tseslint.configs.recommendedTypeChecked,
	{
		languageOptions: {
			parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/explicit-function-return-type": ["warn", { allowExpressions: true }],
			"@typescript-eslint/restrict-plus-operands": ["error", { allowNullish: false }],
			"@typescript-eslint/restrict-template-expressions": ["error", { allow: [], allowNullish: false }],
			"@typescript-eslint/no-misused-promises": "off", // "let me abuse promises in peace"
			"@typescript-eslint/no-unsafe-enum-comparison": "off",
			"no-var": "off",
			"no-console": "warn",
			"prefer-const": "warn"
		}
	}
]);
