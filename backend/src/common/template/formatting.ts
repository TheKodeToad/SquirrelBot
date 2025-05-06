import { formatUser, formatUserBold } from "../../bot/common/discord/format.ts";
import { escapeMarkdown, makeMarkdownInlineCodeblock, makeMarkdownMultilineCodeblock, makeMarkdownQuote } from "../../bot/common/discord/markdown.ts";
import { dateToUnixSeconds, humanizeDuration } from "../time.ts";
import { DurationPresentationType, FormattingWrapper, ParameterType, TimestampPresentationType, UserPresentationType, type AnyParameterValue, type UserParameter } from "./index.ts";
import { TokenType, type Token } from "./parsing.ts";

export function format(params: Record<string, AnyParameterValue>, tokens: Token[]): string {
	let result = "";

	for (const token of tokens) {
		if (token.type === TokenType.Literal) {
			result += token.value;
			continue;
		}

		if (!Object.hasOwn(params, token.parameter))
			throw new Error(`Missing params['${token.parameter}']`);

		const value = params[token.parameter];
		let output: string;

		switch (token.valueType) {
			case ParameterType.User:
				if (!(typeof value === "object"
					&& "id" in value && typeof value.id === "string"
					&& "tag" in value && typeof value.tag === "string")) {
					throw new Error(`params['${token.parameter}'] is not a user!`);
				}

				output = formatUserParam(value, token.presentation);
				break;
			case ParameterType.Duration:
				if (typeof value !== "number")
					throw new Error(`params['${token.parameter}'] is not a number!`);

				output = formatDurationParam(value, token.presentation);
				break;
			case ParameterType.Timestamp:
				if (!(value instanceof Date))
					throw new Error(`params['${token.parameter}'] is not a Date!`);

				output = formatTimestampParam(value, token.presentation);
				break;
			case ParameterType.RawString:
			case ParameterType.MarkdownString:
				if (typeof value !== "string")
					throw new Error(`params['${token.parameter}'] is not a string!`);

				output = value;
				break;
		}

		switch (token.wrapper) {
			case FormattingWrapper.BlockQuote: output = makeMarkdownQuote(output); break;
			case FormattingWrapper.InlineCodeblock: output = makeMarkdownInlineCodeblock(output); break;
			case FormattingWrapper.MultilineCodeblock: output = makeMarkdownMultilineCodeblock(output); break;
		}

		result += output;
	}

	return result;

}

function formatUserParam(user: UserParameter, presentation: UserPresentationType): string {
	switch (presentation) {
		case UserPresentationType.TagMention: return formatUser(user);
		case UserPresentationType.TagMentionBold: return formatUserBold(user);
		case UserPresentationType.Tag: return escapeMarkdown(user.tag);
		case UserPresentationType.Mention: return `<@${user.id}>`;
		case UserPresentationType.ID: return user.id;
		case UserPresentationType.URL: return `https://discord.com/users/${user.id}`;
	}
}

function formatDurationParam(duration: number, presentation: DurationPresentationType): string {
	switch (presentation) {
		case DurationPresentationType.Readable: return humanizeDuration(duration);
		case DurationPresentationType.Milliseconds: return duration.toString();
		case DurationPresentationType.Seconds: return Math.floor(duration / 1000).toString();
	}
}

function formatTimestampParam(timestamp: Date, present: TimestampPresentationType): string {
	switch (present) {
		case TimestampPresentationType.DateTime: return `<t:${dateToUnixSeconds(timestamp)}:f>`;
		case TimestampPresentationType.DateTimeLong: return `<t:${dateToUnixSeconds(timestamp)}:F>`;
		case TimestampPresentationType.Time: return `<t:${dateToUnixSeconds(timestamp)}:t>`;
		case TimestampPresentationType.TimeLong: return `<t:${dateToUnixSeconds(timestamp)}:T>`;
		case TimestampPresentationType.Date: return `<t:${dateToUnixSeconds(timestamp)}:d>`;
		case TimestampPresentationType.DateLong: return `<t:${dateToUnixSeconds(timestamp)}:D>`;
		case TimestampPresentationType.Relative: return `<t:${dateToUnixSeconds(timestamp)}:R>`;
		case TimestampPresentationType.Unix: return timestamp.getTime().toString();
		case TimestampPresentationType.UnixSeconds: return dateToUnixSeconds(timestamp).toString();
	}
}
