import { continuedIndent, foldNodeProp, indentNodeProp, LanguageSupport, LRLanguage } from "@codemirror/language";
import { parser as tomlParser } from "lezer-toml";

export const tomlLanguage = LRLanguage.define({
	parser: tomlParser.configure({
		props: [
			indentNodeProp.add({
				Array: continuedIndent({ except: /^\s*]/ })
			}),
			foldNodeProp.add({
				"Table ArrayTable": node => {
					if (node.firstChild === null || node.lastChild === null) {
						return null;
					}

					return { from: node.firstChild.to, to: node.lastChild.to };
				},
				Array: node => ({ from: node.from + 1, to: node.to - 1 })
			})
		]
	}),
	languageData: {
		commentTokens: { line: "#" },
	}
});

export function toml() {
	return new LanguageSupport(tomlLanguage);
}
