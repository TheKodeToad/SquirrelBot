import { LRLanguage } from "@codemirror/language";
import { parser } from "lezer-toml";

export const tomlHighlighting = LRLanguage.define({
	parser,
	languageData: {
		commentTokens: { line: "#" }
	}
});
