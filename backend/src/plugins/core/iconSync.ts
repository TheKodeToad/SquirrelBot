import type { BackendDiscordContext } from "#discord/discord.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import { EventListenerPhase } from "#extensionPoint.ts";
import { icons } from "#plugins/core/public/icons.ts";

export default [onBotInit(init, EventListenerPhase.Pre)];

async function init(ctx: BackendDiscordContext): Promise<void> {
	const emojis = await ctx.bot.application.getEmojis();
	for (const emoji of emojis.items) {
		if (Object.hasOwn(icons, emoji.name)) {
			icons[emoji.name as keyof typeof icons] =
				`<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
		}
	}
}
