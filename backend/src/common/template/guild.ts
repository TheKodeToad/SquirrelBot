import { escapeMarkdown } from "#common/discord/markdown.ts";
import { m, type InferView } from "mousetache";
import { BASE_URL, Routes, type Guild } from "oceanic.js";

export const GuildView = m.object({
	id: m.terminal({ noEscape: true }),
	name: m.terminal(),
	icon: m.terminal({ noEscape: true }),

	link: m.terminal({ noEscape: true }),
	masked_link: m.terminal({ noEscape: true }),
});
export type GuildView = InferView<typeof GuildView>;

export function makeGuildView(guild: Guild): GuildView {
	const result = {
		id: guild.id,
		name: guild.name,
		get icon() { return guild.iconURL(); },

		get link() { return BASE_URL + Routes.CHANNEL(guild.id); },
		get maskedLink() { return `[${escapeMarkdown(guild.name)}](${this.link})`; },
	};

	return result;
}
