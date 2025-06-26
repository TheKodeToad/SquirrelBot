import { indentLess, insertTab } from "@codemirror/commands";
import { continuedIndent, indentNodeProp, LRLanguage } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { gruvboxDark } from "@fsegurai/codemirror-theme-gruvbox-dark";
import { basicSetup } from "codemirror";
import { parser } from "lezer-toml";

const parserWithMetadata = parser.configure({
	props: [
		indentNodeProp.add({ Array: continuedIndent({ except: /^\s*]/ }) }),
	]
});

export const baseExtensions = [
	basicSetup,
	LRLanguage.define({
		parser: parserWithMetadata,
	}),
	keymap.of([{
		key: "Tab",
		run: insertTab,
		shift: indentLess,
	}]),
	gruvboxDark,
	EditorView.theme({
		"&.cm-focused": {
			outline: "none",
			"box-shadow": "none !important", // HACK
		}
	}),
];
