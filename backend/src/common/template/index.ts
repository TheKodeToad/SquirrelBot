import { format } from "./formatting.ts";
import { parseTemplateTokens, type Token } from "./parsing.ts";

export class Template<P extends Record<string, ParameterType>> {
	private _tokens: Token[];

	public static parse<P extends Record<string, ParameterType>>(template: string, params: P): Template<P> | string {
		const tokens = parseTemplateTokens(template, params);

		if (typeof tokens === "string")
			return tokens;

		return new Template(tokens);
	}

	private constructor(tokens: Token[]) {
		this._tokens = tokens;
	}

	public format(params: { readonly [K in keyof P]: ParameterValue<P[K]> }): string {
		return format(params, this._tokens);
	}
}

export const enum FormattingWrapper {
	BlockQuote,
	InlineCodeblock,
	MultilineCodeblock,
}

export const enum ParameterType {
	User,
	Duration,
	Timestamp,
	RawString,
	MarkdownString,
}

export const enum UserPresentationType {
	TagMention,
	TagMentionBold,
	Tag,
	Mention,
	ID,
	URL,
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

export type AnyParameterValue = ParameterValue<any>;

type ParameterValue<T extends ParameterType = any> =
	T extends ParameterType.User ? UserParameter :
	T extends ParameterType.RawString ? string :
	T extends ParameterType.MarkdownString ? string :
	T extends ParameterType.Duration ? number :
	T extends ParameterType.Timestamp ? Date :
	never;
