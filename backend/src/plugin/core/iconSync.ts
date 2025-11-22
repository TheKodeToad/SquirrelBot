import { onBotInit } from "#discord/extensionPoints.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { EventListenerPhase } from "#extensionPoint.ts";
import { icons } from "#plugin/core/public/icons.ts";

export default [onBotInit(init, EventListenerPhase.Pre)];

async function init(ctx: SquirrelDiscordContext): Promise<void> {
	const emojis = await ctx.bot.application.getEmojis();
	for (const emoji of emojis.items) {
		if (Object.hasOwn(icons, emoji.name)) {
			icons[emoji.name as keyof typeof icons] = `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
		}
	}
}

