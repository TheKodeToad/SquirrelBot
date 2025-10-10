import { escapeMarkdown } from "#common/discord/markdown.ts";
import { paddedHex } from "#common/general.ts";
import { m, type InferView } from "mousetache";

export const RoleView = m.object({
	id: m.terminal({ noEscape: true }),
	name: m.terminal(),
	color: m.terminal({ noEscape: true }),
	hoisted: m.terminal({ noEscape: true }),
	mentionable: m.terminal({ noEscape: true }),

	mention: m.terminal({ noEscape: true }),
	name_mention: m.terminal({ noEscape: true }),
	name_bold_mention: m.terminal({ noEscape: true }),
});
export type RoleView = InferView<typeof RoleView>;

export interface RoleViewable {
	id: string;
	name?: string;
	color?: number;
	hoist?: boolean;
	mentionable?: boolean;
}

export function makeRoleView(role: RoleViewable): RoleView {
	return {
		id: role.id,
		name: role.name,
		get color() {
			if (role.color !== undefined)
				return paddedHex(role.color, 3);
			else
				return undefined;
		},
		hoisted: role.hoist,
		mentionable: role.mentionable,

		get mention() { return `<@&${role.id}>`; },
		get name_mention() {
			if (role.name === undefined)
				return this.mention;

			return `${escapeMarkdown(role.name)} ${this.mention}`;
		},
		get name_bold_mention() {
			if (role.name === undefined)
				return this.mention;

			return `**${escapeMarkdown(role.name)}** ${this.mention}`;
		},
	};
}

