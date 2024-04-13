// everything where an escape is valid and the character sometimes affects formatting
// (all punctuation seems to be possible to escape?)
// perhaps this is not the best way to do this but it should work everywhere apart from inside codeblocks
const FORMATTING_REGEX = /[\\*_\-`#@<>.~|:]/;

export function escape_all(input: string) {
	return input.replace(FORMATTING_REGEX, "\\$1");
}
