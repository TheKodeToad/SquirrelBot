import { indentLess, insertTab } from "@codemirror/commands";
import { continuedIndent, foldNodeProp, indentNodeProp, indentUnit, LRLanguage } from "@codemirror/language";
import { Command, EditorView, keymap } from "@codemirror/view";
import { gruvboxDark } from "@fsegurai/codemirror-theme-gruvbox-dark";
import { SyntaxNode } from "@lezer/common";
import { basicSetup } from "codemirror";
import { parser } from "lezer-toml";


function foldExceptFirst(node: SyntaxNode) {
	if (node.firstChild === null || node.lastChild === null)
		return null;

	//const firstLine = state.doc.lineAt(first.from);
	//const secondLine = state.doc.lineAt(second.from);
	return { from: node.firstChild.to, to: node.lastChild.to };
}

function foldCharOffset(fromOffset: number, toOffset: number) {
	return (node: SyntaxNode) => ({ from: node.from + fromOffset, to: node.to + toOffset });
}

const toml = LRLanguage.define({
	parser: parser.configure({
		props: [
			indentNodeProp.add({ Array: continuedIndent({ except: /^\s*]/ }) }),
			foldNodeProp.add({
				Table: foldExceptFirst,
				ArrayTable: foldExceptFirst,
				Array: foldCharOffset(1, -1),
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
