import { indentLess, insertTab } from "@codemirror/commands";
import { continuedIndent, indentNodeProp, indentUnit, LRLanguage } from "@codemirror/language";
import { Command, EditorView, keymap } from "@codemirror/view";
import { gruvboxDark } from "@fsegurai/codemirror-theme-gruvbox-dark";
import { basicSetup } from "codemirror";
import { parser } from "lezer-toml";

const toml = LRLanguage.define({
	parser: parser.configure({
		props: [
			indentNodeProp.add({ Array: continuedIndent({ except: /^\s*]/ }) }),
		]
	}),
	languageData: {
		commentTokens: { line: "#" }
	}
});

export function baseExtensions(saveAction: Command) {
	return [
		basicSetup,
		toml,
		keymap.of([{
			key: "Tab",
			run: insertTab,
			shift: indentLess,
		}]),
		keymap.of([{
			key: "Mod-s",
			run: saveAction,
		}]),
		indentUnit.of("\t"),
		gruvboxDark,
		EditorView.theme({
			"&.cm-focused": {
				outline: "none",
				"box-shadow": "none !important", // HACK
			}
		}),
	];
}
