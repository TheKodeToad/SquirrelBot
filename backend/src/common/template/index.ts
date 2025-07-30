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

import { formatTokens } from "#common/template/formatting.ts";
import { parseTemplateTokens, TokenType } from "#common/template/parsing.ts";

/**
 * @returns A function to call to format data with the template,
 * or an error denoting something that went wrong with parsing.
 */
export function parseTemplate<S extends TemplateSchema>(template: string, schema: S, allowEscape = true): ((params: ParameterRecord<S>) => string) | string {
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

	return params => formatTokens(params, tokens, allowEscape);
}

export type TemplateSchema = Record<string, ParameterType>;
export type ParameterRecord<S extends Record<string, ParameterType> = any> = { readonly [K in keyof S]?: ParameterValue<S[K]> };

export const enum FormattingWrapper {
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

export const enum UserPresentationType {
	Tag,
	Mention,
	TagMention,
	TagMentionBold,
	ID,
	Link,
	MaskedLink,
}

export const enum GuildPresentationType {
	Name,
	ID,
	Link,
	MaskedLink,
}

export const enum RolePresentationType {
	Name,
	Mention,
	NameMention,
	NameMentionBold,
	ID,
}

export const enum DurationPresentationType {
	Readable,
	Seconds,
	Milliseconds,
}

export const enum TimestampPresentationType {
	DateTime,
	DateTimeLong,
	Time,
	TimeLong,
	Date,
	DateLong,
	Relative,
	Unix,
	UnixSeconds,
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
