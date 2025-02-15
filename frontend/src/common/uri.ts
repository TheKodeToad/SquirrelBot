export function build_uri(strings: TemplateStringsArray, ...expressions: string[]): string {
	if (expressions === undefined)
		return strings[0]!;

	let result = "";

	for (let i = 0; i < strings.length; ++i) {
		result += strings[i]!;
		if (i < expressions.length)
			result += encodeURIComponent(expressions[i]!);
	}

	return result;
}
