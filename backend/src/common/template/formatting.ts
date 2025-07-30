import { formatUser, formatUserBold } from "#common/discord/format.ts";
import { escapeMarkdown, makeMarkdownInlineCodeblock, makeMarkdownMultilineCodeblock, makeMarkdownQuote } from "#common/discord/markdown.ts";
import { DurationPresentationType, FormattingWrapper, GuildPresentationType, ParameterType, RolePresentationType, TimestampPresentationType, UserPresentationType, type EntityParameter, type ParameterRecord, type UserParameter } from "#common/template/index.ts";
import { TokenType, type Token } from "#common/template/parsing.ts";
import { dateToUnixSeconds, humanizeDuration } from "#common/time.ts";
import { INTERNAL_TYPE_INTEGRITY } from "#environment.ts";

export function formatTokens(params: ParameterRecord, tokens: Token[], allowEscape = true): string {
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
				if (!isUserParam(value))
					throw new Error(`params['${token.parameter}'] is not a user!`);

				output = formatUserParam(value, token.presentation, escaped);
				break;
			case ParameterType.Guild:
				if (!isEntityParam(value))
					throw new Error(`params['${token.parameter}'] is not a guild!`);

				output = formatGuildParam(value, token.presentation, escaped);
				break;
			case ParameterType.Role:
				if (!isEntityParam(value))
					throw new Error(`params['${token.parameter}'] is not a role!`);

				output = formatRoleParam(value, token.presentation, escaped);
				break;
			case ParameterType.Number:
				if (typeof value !== "number")
					throw new Error(`params['${token.parameter}'] is not a number!`);

				output = value.toString();
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

				if (escaped && token.valueType === ParameterType.RawString)
					output = escapeMarkdown(value);
				else
					output = value;
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

function isUserParam(value: {} | undefined): value is UserParameter {
	if (!INTERNAL_TYPE_INTEGRITY)
		return true;

	return typeof value === "object"
		&& "id" in value && typeof value.id === "string"
		&& "tag" in value && typeof value.tag === "string";
}

function isEntityParam(value: {} | undefined): value is EntityParameter {
	if (!INTERNAL_TYPE_INTEGRITY)
		return true;

	return typeof value === "object"
		&& "id" in value && typeof value.id === "string"
		&& "name" in value && typeof value.name === "string";
}

function formatUserParam(user: UserParameter, presentation: UserPresentationType, escaped: boolean): string {
	switch (presentation) {
	case UserPresentationType.TagMention:
		return formatUser(user);
	case UserPresentationType.TagMentionBold:
		return formatUserBold(user);
	case UserPresentationType.Tag:
		return escaped ? escapeMarkdown(user.tag) : user.tag;
	case UserPresentationType.Mention:
		return `<@${user.id}>`;
	case UserPresentationType.ID:
		return user.id;
	case UserPresentationType.Link:
		return `https://discord.com/users/${user.id}`;
	case UserPresentationType.MaskedLink:
		return `[${escapeMarkdown(user.tag)}](https://discord.com/users/${user.id})`;
	}
}

function formatGuildParam(guild: EntityParameter, presentation: GuildPresentationType, escaped: boolean): string {
	switch (presentation) {
	case GuildPresentationType.Name:
		return escaped ? escapeMarkdown(guild.name) : guild.name;
	case GuildPresentationType.ID:
		return guild.id;
	case GuildPresentationType.Link:
		return `https://discord.com/channels/${guild.id}`;
	case GuildPresentationType.MaskedLink:
		return `[${escapeMarkdown(guild.name)}](https://discord.com/channels/${guild.id})`;
	}
}

function formatRoleParam(role: EntityParameter, presentation: RolePresentationType, escaped: boolean): string {
	switch (presentation) {
	case RolePresentationType.Name:
		return escaped ? escapeMarkdown(role.name) : role.name;
	case RolePresentationType.Mention:
		return `<@&${role.id}>`;
	case RolePresentationType.NameMention:
		return `${escapeMarkdown(role.name)} (<@&${role.id}>)`;
	case RolePresentationType.NameMentionBold:
		return `**${escapeMarkdown(role.name)} (<@&${role.id}>)**`;
	case RolePresentationType.ID:
		return role.id;
	}
}

function formatDurationParam(duration: number, presentation: DurationPresentationType): string {
	switch (presentation) {
	case DurationPresentationType.Readable:
		return humanizeDuration(duration);
	case DurationPresentationType.Milliseconds:
		return duration.toString();
	case DurationPresentationType.Seconds:
		return Math.floor(duration / 1000).toString();
	}
}

function formatTimestampParam(timestamp: Date, present: TimestampPresentationType): string {
	switch (present) {
	case TimestampPresentationType.DateTime:
		return `<t:${dateToUnixSeconds(timestamp)}:f>`;
	case TimestampPresentationType.DateTimeLong:
		return `<t:${dateToUnixSeconds(timestamp)}:F>`;
	case TimestampPresentationType.Time:
		return `<t:${dateToUnixSeconds(timestamp)}:t>`;
	case TimestampPresentationType.TimeLong:
		return `<t:${dateToUnixSeconds(timestamp)}:T>`;
	case TimestampPresentationType.Date:
		return `<t:${dateToUnixSeconds(timestamp)}:d>`;
	case TimestampPresentationType.DateLong:
		return `<t:${dateToUnixSeconds(timestamp)}:D>`;
	case TimestampPresentationType.Relative:
		return `<t:${dateToUnixSeconds(timestamp)}:R>`;
	case TimestampPresentationType.Unix:
		return timestamp.getTime().toString();
	case TimestampPresentationType.UnixSeconds:
		return dateToUnixSeconds(timestamp).toString();
	}
}
