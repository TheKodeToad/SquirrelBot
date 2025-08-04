/*
 * Parsing and formatting for templates for config values like 'Hello {{user#tag}}'.
 *
 * The message is split in to "tokens" and validated based on the passed schema.
 * This is a loose usage of the term, but in this case tokens consist of:
 * - Any literal text
 * - Parsed expressions inside {{}}
 *
 * These tokens are then rejoined in the formatting stage, based on the passed parameters.
 */

import { escapeMarkdown, makeMarkdownInlineCodeblock, makeMarkdownMultilineCodeblock, makeMarkdownQuote } from "#common/discord/markdown.ts";
import { DurationPresentation, formatDurationParam, parseDurationPresentation } from "#common/template/presentation/duration.ts";
import { formatGuildParam, GuildPresentation, parseGuildPresentation } from "#common/template/presentation/guild.ts";
import { formatRoleParam, parseRolePresentation, RolePresentation } from "#common/template/presentation/role.ts";
import { formatTimestampParam, parseTimestampPresentation, TimestampPresentation } from "#common/template/presentation/timestamp.ts";
import { formatUserParam, parseUserPresentation, UserPresentation } from "#common/template/presentation/user.ts";

interface TemplateWrapper<S extends TemplateSchema> {
	apply: ((params: ParameterRecord<S>) => string);
}

/**
 * @returns A function to call to format data with the template,
 * or an error denoting something that went wrong with parsing.
 */
export function parseTemplate<S extends TemplateSchema>(template: string, schema: S, allowEscape = true): TemplateWrapper<S> | string {
	// just a typed wrapper
	const tokens = parseTemplateTokens(template, schema);

	if (typeof tokens === "string")
		return tokens;

	if (tokens.length === 0)
		return () => "";

	if (tokens.length === 1 && tokens[0]!.type === TokenType.Literal) {
		const { value } = tokens[0]!;
		return () => value;
	}

	return {
		apply(params) {
			return formatTokens(params, tokens, allowEscape);
		}
	};
}

type Token = LiteralToken | FormatToken;

const enum TokenType {
	Literal,
	Format,
}

interface LiteralToken {
	type: TokenType.Literal;
	value: string;
}

type FormatToken =
	{ type: TokenType.Format; parameter: string; }
	& (
		| { valueType: ParameterType.User; presentation: UserPresentation; }
		| { valueType: ParameterType.Guild; presentation: GuildPresentation; }
		| { valueType: ParameterType.Role; presentation: RolePresentation; }
		| { valueType: ParameterType.Duration; presentation: DurationPresentation; }
		| { valueType: ParameterType.Timestamp; presentation: TimestampPresentation; }
		| { valueType: ParameterType.Number | ParameterType.MarkdownString | ParameterType.RawString; }
	)
	& { wrapper: FormattingWrapper | null; };


type TemplateSchema = Record<string, ParameterType>;
export type ParameterRecord<S extends Record<string, ParameterType> = any> = { readonly [K in keyof S]?: ParameterValue<S[K]> };

const enum FormattingWrapper {
	BlockQuote,
	InlineCodeblock,
	MultilineCodeblock,
}

export const enum ParameterType {
	User,
	Guild,
	Role,
	Number,
	Duration,
	Timestamp,
	/** Escape markdown */
	RawString,
	/** Preserve markdown */
	MarkdownString,
}

export type UserParameter = { id: string; tag: string; };
export type EntityParameter = { id: string; name: string; };

type ParameterValue<T extends ParameterType = any> =
	T extends ParameterType.User ? UserParameter :
	T extends ParameterType.Guild ? EntityParameter :
	T extends ParameterType.Role ? EntityParameter :
	T extends ParameterType.Number ? number :
	T extends ParameterType.RawString ? string :
	T extends ParameterType.MarkdownString ? string :
	T extends ParameterType.Duration ? number :
	T extends ParameterType.Timestamp ? Date :
	never;

const FORMAT_PATTERN = /\{\{(?<wrapper>>|`|```)?(?<parameter>\w+)(?:#(?<presentation>\w+))?\}\}?/g;

interface FormatGroups {
	wrapper?: ">" | "`" | "```";
	parameter: string;
	presentation?: string;
};

function parseTemplateTokens(template: string, schema: Record<string, ParameterType>): Token[] | string {
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

	// TODO: what is this horror...

	switch (valueType) {
	case ParameterType.User: {
		const presentation = parseUserPresentation(input.presentation);

		if (presentation === null)
			return `Invalid user presentation: '${input.presentation!}'`;

		return { ...result, valueType, presentation };
	}
	case ParameterType.Guild: {
		const presentation = parseGuildPresentation(input.presentation);

		if (presentation === null)
			return `Invalid guild presentation: '${input.presentation!}'`;

		return { ...result, valueType, presentation };
	}
	case ParameterType.Role: {
		const presentation = parseRolePresentation(input.presentation);

		if (presentation === null)
			return `Invalid role presentation: '${input.presentation!}'`;

		return { ...result, valueType, presentation };
	}
	case ParameterType.Duration: {
		const presentation = parseDurationPresentation(input.presentation);

		if (presentation === null)
			return `Invalid duration presentation: '${input.presentation!}'`;

		return { ...result, valueType, presentation };
	}
	case ParameterType.Timestamp: {
		const presentation = parseTimestampPresentation(input.presentation);

		if (presentation === null)
			return `Invalid timestamp presentation: '${input.presentation!}'`;

		return { ...result, valueType, presentation };
	}
	case ParameterType.Number:
	case ParameterType.RawString:
	case ParameterType.MarkdownString:
		return { ...result, valueType };
	}
}

function parseWrapper(input: FormatGroups["wrapper"]): FormattingWrapper | null {
	switch (input) {
	case ">":
		return FormattingWrapper.BlockQuote;
	case "`":
		return FormattingWrapper.InlineCodeblock;
	case "```":
		return FormattingWrapper.MultilineCodeblock;
	case undefined:
		return null;
	}
}

function formatTokens(params: ParameterRecord, tokens: Token[], allowEscape = true): string {
	let result = "";

	for (const token of tokens) {
		if (token.type === TokenType.Literal) {
			result += token.value;
			continue;
		}

		const escaped = allowEscape
			&& token.wrapper !== FormattingWrapper.InlineCodeblock
			&& token.wrapper !== FormattingWrapper.MultilineCodeblock;

		let output: string;

		if (Object.hasOwn(params, token.parameter) && params[token.parameter] !== undefined) {
			const value = params[token.parameter];

			switch (token.valueType) {
			case ParameterType.User:
				output = formatUserParam(value as UserParameter, token.presentation, escaped);
				break;
			case ParameterType.Guild:
				output = formatGuildParam(value as EntityParameter, token.presentation, escaped);
				break;
			case ParameterType.Role:
				output = formatRoleParam(value as EntityParameter, token.presentation, escaped);
				break;
			case ParameterType.Number:
				output = (value as number).toString();
				break;
			case ParameterType.Duration:
				output = formatDurationParam(value as number, token.presentation);
				break;
			case ParameterType.Timestamp:
				output = formatTimestampParam(value as Date, token.presentation);
				break;
			case ParameterType.RawString:
			case ParameterType.MarkdownString:
				if (escaped && token.valueType === ParameterType.RawString)
					output = escapeMarkdown(value as string);
				else
					output = value as string;
				break;
			}
		} else
			output = escaped ? "*None*" : "None";

		switch (token.wrapper) {
		case FormattingWrapper.BlockQuote:
			output = makeMarkdownQuote(output);
			break;
		case FormattingWrapper.InlineCodeblock:
			output = makeMarkdownInlineCodeblock(output);
			break;
		case FormattingWrapper.MultilineCodeblock:
			output = makeMarkdownMultilineCodeblock(output);
			break;
		}

		result += output;
	}

	return result;
}
