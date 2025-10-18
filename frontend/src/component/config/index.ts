import { indentLess, insertTab } from "@codemirror/commands";
import { continuedIndent, foldNodeProp, indentNodeProp, indentUnit, LRLanguage } from "@codemirror/language";
import { Command, EditorView, keymap } from "@codemirror/view";
import { gruvboxDark } from "@fsegurai/codemirror-theme-gruvbox-dark";
import { basicSetup } from "codemirror";
import { parser } from "lezer-toml";

const toml = LRLanguage.define({
	parser: parser.configure({
		props: [
			indentNodeProp.add({ Array: continuedIndent({ except: /^\s*]/ }) }),
			foldNodeProp.add({
				"Table ArrayTable": node => {
					if (node.firstChild === null || node.lastChild === null)
						return null;

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

export function baseExtensions(options: {
	save: Command,
	markDirty: () => void,
}) {
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
			run: options.save,
		}]),
		indentUnit.of("\t"),
		gruvboxDark,
		EditorView.theme({
			"&.cm-focused": {
				outline: "none",
				"box-shadow": "none !important", // HACK
			}
		}),
		EditorView.updateListener.of(update => {
			if (update.docChanged)
				options.markDirty();
		})
	];
}
