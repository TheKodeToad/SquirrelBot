import { DurationPresentationType, FormattingWrapper, ParameterType, TimestampPresentationType, UserPresentationType } from "./index.ts";

const FORMAT_PATTERN = /\{\{(?<wrapper>>|`|```)?(?<parameter>\w+)(?:#(?<presentation>\w+))?\}\}?/g;

interface FormatGroups {
	wrapper?: ">" | "`" | "```";
	parameter: string;
	presentation?: string;
};

export function parseTemplateTokens(template: string, schema: Record<string, ParameterType>): Token[] | string {
	const result: Token[] = [];

	let match = FORMAT_PATTERN.exec(template);
	let literalStart = 0;

	while (match !== null) {
		if (literalStart !== match.index) {
			result.push({
				type: TokenType.Literal,
				value: template.substring(literalStart, match.index),
			});
		}

		const groups = match.groups as unknown as FormatGroups;
		const token = parseFormatToken(groups, schema);

		if (typeof token === "string")
			return token;
		else
			result.push(token);

		literalStart = FORMAT_PATTERN.lastIndex;
		match = FORMAT_PATTERN.exec(template);
	}

	if (literalStart !== template.length) {
		result.push({
			type: TokenType.Literal,
			value: template.substring(literalStart)
		});
	}

	return result;
}

function parseFormatToken(input: FormatGroups, params: Record<string, ParameterType>): FormatToken | string {
	if (!Object.hasOwn(params, input.parameter))
		return `No value named '${input.parameter}' exists`;

	const valueType = params[input.parameter]!;
	const wrapper = parseWrapper(input.wrapper);

	const result = { type: TokenType.Format, parameter: input.parameter, wrapper } as const;

	switch (valueType) {
		case ParameterType.User: {
			const presentation = parseUserPresentation(input.presentation);

			if (presentation === null)
				return `Invalid user presentation: '${input.presentation!}'`;

			return { ...result, valueType, presentation };
		}
		case ParameterType.Duration: {
			const presentation = parseDurationPresentation(input.presentation);

			if (presentation === null)
				return `Invalid duration presentation: '${input.presentation!}'`;

			return { ...result, valueType, presentation };
		}
		case ParameterType.Timestamp:
			const presentation = parseTimestampPresentation(input.presentation);

			if (presentation === null)
				return `Invalid timestamp presentation: '${input.presentation!}'`;

			return { ...result, valueType, presentation };
		case ParameterType.RawString:
		case ParameterType.MarkdownString:
			return { ...result, valueType };
	}
}

function parseWrapper(input: FormatGroups["wrapper"]): FormattingWrapper | null {
	switch (input) {
		case ">": return FormattingWrapper.BlockQuote;
		case "`": return FormattingWrapper.InlineCodeblock;
		case "```": return FormattingWrapper.MultilineCodeblock;
		case undefined: return null;
	}
}

function parseUserPresentation(input: string | undefined): UserPresentationType | null {
	switch (input) {
		case "tag_mention": case undefined: return UserPresentationType.TagMention;
		case "tag_mention_bold": return UserPresentationType.TagMentionBold;
		case "tag": return UserPresentationType.Tag;
		case "mention": return UserPresentationType.Mention;
		case "id": return UserPresentationType.ID;
		case "url": return UserPresentationType.URL;
		default: return null;
	}
}

function parseDurationPresentation(input: string | undefined): DurationPresentationType | null {
	switch (input) {
		case "readable": case undefined: return DurationPresentationType.Readable;
		case "seconds": case undefined: return DurationPresentationType.Seconds;
		case "milliseconds": case undefined: return DurationPresentationType.Milliseconds;
		default: return null;
	}
}

function parseTimestampPresentation(input: string | undefined): TimestampPresentationType | null {
	switch (input) {
		case "date_time": case "f": case undefined: return TimestampPresentationType.DateTime;
		case "date_time_long": case "F": case undefined: return TimestampPresentationType.DateTimeLong;
		case "time": case "t": case undefined: return TimestampPresentationType.Time;
		case "time_long": case "T": case undefined: return TimestampPresentationType.TimeLong;
		case "date": case "d": case undefined: return TimestampPresentationType.Date;
		case "date_long": case "D": case undefined: return TimestampPresentationType.DateLong;
		case "relative": case "r": case "R": case undefined: return TimestampPresentationType.Relative;
		case "unix": case undefined: return TimestampPresentationType.Unix;
		case "unix_seconds": case undefined: return TimestampPresentationType.UnixSeconds;
		default: return null;
	}
}

export type Token = LiteralToken | FormatToken;

export enum TokenType {
	Literal,
	Format,
}

export interface LiteralToken {
	type: TokenType.Literal;
	value: string;
}

export type FormatToken =
	{ type: TokenType.Format; parameter: string; }
	& (
		| { valueType: ParameterType.User; presentation: UserPresentationType; }
		| { valueType: ParameterType.Duration; presentation: DurationPresentationType; }
		| { valueType: ParameterType.Timestamp; presentation: TimestampPresentationType; }
		| { valueType: ParameterType.MarkdownString | ParameterType.RawString; }
	)
	& { wrapper: FormattingWrapper | null; };
