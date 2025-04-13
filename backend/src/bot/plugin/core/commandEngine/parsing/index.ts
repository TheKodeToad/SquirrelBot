import type { AnyArgsValue } from "../../public/command/index.ts";

export const enum ArgsParseError {
	MissingOptions,
	BadNamedKey,
	BadNamedValue,
	BareNamedKey,
	BadPositionalIndex,
	BadPoisitionValue,
}

export type ArgsParseResultWithError =
	| { error: ArgsParseError.MissingOptions; options: Set<string>; }
	| { error: ArgsParseError.BadNamedKey | ArgsParseError.BadNamedValue; name: string; }
	| { error: ArgsParseError.BareNamedKey; }
	| { error: ArgsParseError.BadPositionalIndex | ArgsParseError.BadPoisitionValue; index: number; };

export type ArgsParseResult =
	| { error: null; result: Record<string, AnyArgsValue>; }
	| ArgsParseResultWithError;

export function formatArgsParseError(error: ArgsParseResultWithError): string {
	switch (error.error) {
		case ArgsParseError.MissingOptions:
			return `Missing options: ${[...error.options].map(option => "'" + option + "'").join(", ")}.`;

		case ArgsParseError.BareNamedKey:
			return "Missing option name after hyphen.";

		case ArgsParseError.BadNamedKey:
			return `No option named '${error.name}'.`;

		case ArgsParseError.BadNamedValue:
			return `Invalid value passed for '${error.name}'.`;

		case ArgsParseError.BadPositionalIndex:
			return "Too many unlabeled options provided.";

		case ArgsParseError.BadPoisitionValue:
			return `Invalid value passed for unlabeled option #${error.index + 1}.`;
	}
}
