// TODO remove this when chrome adds toBase64 lol

export interface Base64Options {
	alphabet: "base64" | "base64url";
	omitPadding: boolean;
}

export function Uint8Array_toBase64(array: Uint8Array, options: Base64Options): string {
	if ("toBase64" in array && typeof array.toBase64 === "function")
		return array.toBase64(options);
	else {
		// I have had enough suffering:
		// https://stackoverflow.com/a/11562550
		let result = btoa(String.fromCharCode(...new Uint8Array(array)));

		if (options.alphabet === "base64url")
			result = result.replace("+", "-").replace("/", "_");

		if (options.omitPadding) {
			if (result.endsWith("="))
				result.slice(0, -1);

			if (result.endsWith("="))
				result.slice(0, -1);
		}

		return result;
	}
}
