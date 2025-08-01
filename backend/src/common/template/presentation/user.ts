import { formatUser, formatUserBold } from "#common/discord/format.ts";
import { escapeMarkdown } from "#common/discord/markdown.ts";
import type { UserParameter } from "#common/template/index.ts";

export const enum UserPresentation {
	Tag,
	Mention,
	TagMention,
	TagMentionBold,
	ID,
	Link,
	MaskedLink,
}

export function parseUserPresentation(input: string | undefined): UserPresentation | null {
	switch (input) {
	case "tag":
	case undefined:
		return UserPresentation.Tag;
	case "mention":
		return UserPresentation.Mention;
	case "tag_mention":
		return UserPresentation.TagMention;
	case "tag_mention_bold":
		return UserPresentation.TagMentionBold;
	case "id":
		return UserPresentation.ID;
	case "link":
		return UserPresentation.Link;
	case "masked_link":
		return UserPresentation.MaskedLink;
	default:
		return null;
	}
}

export function formatUserParam(user: UserParameter, presentation: UserPresentation, escaped: boolean): string {
	switch (presentation) {
	case UserPresentation.TagMention:
		return formatUser(user);
	case UserPresentation.TagMentionBold:
		return formatUserBold(user);
	case UserPresentation.Tag:
		return escaped ? escapeMarkdown(user.tag) : user.tag;
	case UserPresentation.Mention:
		return `<@${user.id}>`;
	case UserPresentation.ID:
		return user.id;
	case UserPresentation.Link:
		return `https://discord.com/users/${user.id}`;
	case UserPresentation.MaskedLink:
		return `[${escapeMarkdown(user.tag)}](https://discord.com/users/${user.id})`;
	}
}
