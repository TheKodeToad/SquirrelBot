// everything where an escape is valid and the character sometimes affects formatting
// (all punctuation seems to be possible to escape?)
// perhaps this is not the best way to do this but it should work everywhere apart from inside codeblocks
const FORMATTING_REGEX = /[\\/*_\-`#@<>.~|:\[\]\(\)]/g;

/**
 * Escape all characters used for markdown formatting.
 * Mainly used whenever a username is being displayed.
 * Make sure that the field supports formatting - a common mistake is to use in embed titles which do not have foramtting applied!
 * !! Do not use as a replacement for allowedMentions or SUPRESS_EMBEDS !!
 */
export function escape_markdown(input: string) {
	return input.replace(FORMATTING_REGEX, "\\$&");
}
