import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"
import typescript from "@typescript-eslint/eslint-plugin"
import typescriptParser from "@typescript-eslint/parser"

const compat = new FlatCompat()

export default [
	js.configs.recommended,
	...compat.extends("plugin:@typescript-eslint/recommended", "plugin:@typescript-eslint/eslint-recommended"),
	{
		ignores: [
			"node_modules/**/*",
			"patches/**/*",
			".vscode/**/*",
			".github/**/*",
			".git/**/*",
			"**/*.css",
			"**/*.scss",
			"**/*.svg",
			"**/*.png",
			"**/*.jpg",
			"**/*.jpeg",
			"**/*.gif",
			"**/*.webp",
			"**/locales/**/*",
			"**/dist/**/*"
		]
	},
	{
		files: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.js", "src/**/*.jsx"],
		languageOptions: {
			parser: typescriptParser
		},
		plugins: {
			"@typescript-eslint": typescript
		},
		rules: {
			eqeqeq: 2,
			quotes: ["error", "double"],
			"no-mixed-spaces-and-tabs": 0,
			"no-duplicate-imports": "error",
			"no-extra-semi": 0,
			"@typescript-eslint/ban-types": "off",
			"react/react-in-jsx-scope": "off",
			"react/prop-types": "off"
		}
	}
]
