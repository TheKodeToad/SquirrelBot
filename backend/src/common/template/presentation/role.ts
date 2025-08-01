import { escapeMarkdown } from "#common/discord/markdown.ts";
import type { EntityParameter } from "#common/template/index.ts";

export const enum RolePresentation {
	Name,
	Mention,
	NameMention,
	NameMentionBold,
	ID,
}

export function parseRolePresentation(input: string | undefined): RolePresentation | null {
	switch (input) {
	case "name":
	case undefined:
		return RolePresentation.Name;
	case "mention":
		return RolePresentation.Mention;
	case "name_mention":
		return RolePresentation.NameMention;
	case "name_mention_bold":
		return RolePresentation.NameMentionBold;
	case "id":
		return RolePresentation.ID;
	default:
		return null;
	}
}

export function formatRoleParam(role: EntityParameter, presentation: RolePresentation, escaped: boolean): string {
	switch (presentation) {
	case RolePresentation.Name:
		return escaped ? escapeMarkdown(role.name) : role.name;
	case RolePresentation.Mention:
		return `<@&${role.id}>`;
	case RolePresentation.NameMention:
		return `${escapeMarkdown(role.name)} (<@&${role.id}>)`;
	case RolePresentation.NameMentionBold:
		return `**${escapeMarkdown(role.name)} (<@&${role.id}>)**`;
	case RolePresentation.ID:
		return role.id;
	}
}
