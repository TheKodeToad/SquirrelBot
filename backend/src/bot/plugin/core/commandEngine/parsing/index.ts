import type { AnyArgsValue } from "../../public/command/index.ts";

export const enum ArgsParseError {
	MISSING_OPTIONS,
	BAD_NAMED_KEY,
	BAD_NAMED_VALUE,
	BARE_NAMED_KEY,
	BAD_POSITIONAL_INDEX,
	BAD_POSITIONAL_VALUE
}

export type ArgsParseResultWithError =
	| { error: ArgsParseError.MISSING_OPTIONS; options: Set<string>; }
	| { error: ArgsParseError.BAD_NAMED_KEY | ArgsParseError.BAD_NAMED_VALUE; name: string; }
	| { error: ArgsParseError.BARE_NAMED_KEY; }
	| { error: ArgsParseError.BAD_POSITIONAL_INDEX | ArgsParseError.BAD_POSITIONAL_VALUE; index: number; };

export type ArgsParseResult =
	| { error: null; result: Record<string, AnyArgsValue>; }
	| ArgsParseResultWithError;

export function formatArgsParseError(error: ArgsParseResultWithError): string {
	switch (error.error) {
		case ArgsParseError.MISSING_OPTIONS:
			return `Missing options: ${[...error.options].map(option => "'" + option + "'").join(", ")}.`;

		case ArgsParseError.BARE_NAMED_KEY:
			return "Missing option name after hyphen.";

		case ArgsParseError.BAD_NAMED_KEY:
			return `No option named '${error.name}'.`;

		case ArgsParseError.BAD_NAMED_VALUE:
			return `Invalid value passed for '${error.name}'.`;

		case ArgsParseError.BAD_POSITIONAL_INDEX:
			return "Too many unlabeled options provided.";

		case ArgsParseError.BAD_POSITIONAL_VALUE:
			return `Invalid value passed for unlabeled option #${error.index + 1}.`;
	}
}
