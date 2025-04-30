import { indentLess, insertTab } from "@codemirror/commands";
import { indentNodeProp, LRLanguage } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { parser } from "lezer-toml";

const parserWithMetadata = parser.configure({
	props: [
		indentNodeProp.add({
			Array: context => context.column(context.node.from) + context.unit
		}),
	]
});

export const baseExtensions = [
	basicSetup,
	oneDark,
	LRLanguage.define({
		parser: parserWithMetadata,
	}),
	keymap.of([{
		key: "Tab",
		run: insertTab,
		shift: indentLess,
	}]),
	EditorView.theme({
		"&.cm-focused": {
			outline: "none"
		}
	})
];
