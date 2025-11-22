import type { AnyArgsValue } from "#plugin/core/public/command.ts";

export const enum ArgsParseError {
	MissingOptions,
	BadNamedKey,
	BadNamedValue,
	BareNamedKey,
	BadPositionalIndex,
	BadPoisitionalValue,
}

export type ArgsParseResultWithError =
	| { error: ArgsParseError.MissingOptions; options: Set<string> }
	| {
			error: ArgsParseError.BadNamedKey | ArgsParseError.BadNamedValue;
			name: string;
	  }
	| { error: ArgsParseError.BareNamedKey }
	| { error: ArgsParseError.BadPositionalIndex; index: number }
	| { error: ArgsParseError.BadPoisitionalValue; index: number; name: string };

export type ArgsParseResult =
	| { error: null; result: Record<string, AnyArgsValue> }
	| ArgsParseResultWithError;

export function formatArgsParseError(error: ArgsParseResultWithError): string {
	switch (error.error) {
		case ArgsParseError.MissingOptions:
			return `Missing options: ${[...error.options].map((option) => "'" + option + "'").join(", ")}.`;
		case ArgsParseError.BareNamedKey:
			return "Missing option name after hyphen.";
		case ArgsParseError.BadNamedKey:
			return `No option named '${error.name}'.`;
		case ArgsParseError.BadNamedValue:
			return `Invalid value passed for '${error.name}'.`;
		case ArgsParseError.BadPositionalIndex:
			return "Too many unlabeled options provided.";
		case ArgsParseError.BadPoisitionalValue:
			return `Invalid value passed for '${error.name}' (unlabeled option #${error.index + 1}).`;
	}
}
