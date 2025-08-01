import { escapeMarkdown } from "#common/discord/markdown.ts";
import type { EntityParameter } from "#common/template/index.ts";

export const enum GuildPresentation {
	Name,
	ID,
	Link,
	MaskedLink,
}

export function parseGuildPresentation(input: string | undefined): GuildPresentation | null {
	switch (input) {
	case "name":
	case undefined:
		return GuildPresentation.Name;
	case "id":
		return GuildPresentation.ID;
	case "link":
		return GuildPresentation.Link;
	case "masked_link":
		return GuildPresentation.MaskedLink;
	default:
		return null;
	}
}

export function formatGuildParam(guild: EntityParameter, presentation: GuildPresentation, escaped: boolean): string {
	switch (presentation) {
	case GuildPresentation.Name:
		return escaped ? escapeMarkdown(guild.name) : guild.name;
	case GuildPresentation.ID:
		return guild.id;
	case GuildPresentation.Link:
		return `https://discord.com/channels/${guild.id}`;
	case GuildPresentation.MaskedLink:
		return `[${escapeMarkdown(guild.name)}](https://discord.com/channels/${guild.id})`;
	}
}
