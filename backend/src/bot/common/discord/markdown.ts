// everything where an escape is valid and the character sometimes affects formatting
// (all punctuation seems to be possible to escape?)
// perhaps this is not the best way to do this but it should work everywhere apart from inside codeblocks
const FORMATTING_REGEX = /[\\/*_\-`#@<>.~|:\[\]\(\)]/g;
const ZWSP = "\u200B";

/**
 * Escape all characters used for markdown formatting.
 * Mainly used whenever a username is being displayed.
 * Make sure that the field supports formatting - a common mistake is to use in embed titles which do not have foramtting applied!
 * !! Do not use as a replacement for allowedMentions or SUPRESS_EMBEDS !!
 */
export function escapeMarkdown(input: string): string {
	return input.replace(FORMATTING_REGEX, "\\$&");
}

export function makeInlineCodeblock(input: string): string {
	return "``" + input.replaceAll("`", ZWSP + "`" + ZWSP) + "``";
}

export function makeMultilineCodeblock(input: string): string {
	return "```\n" + input.replaceAll("`", ZWSP + "`" + ZWSP) + "\n```";
}