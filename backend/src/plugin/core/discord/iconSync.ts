import { onBotInit } from "#discord/extensionPoints.ts";
import { bot } from "#discord/index.ts";
import { EventListenerPhase } from "#loader/extensionPoint.ts";
import { icons } from "#plugin/core/discord/public/icons.ts";

export default [onBotInit(init, EventListenerPhase.Pre)];

async function init(): Promise<void> {
	const emojis = await bot.application.getEmojis();
	for (const emoji of emojis.items)
		if (Object.hasOwn(icons, emoji.name))
			icons[emoji.name as keyof typeof icons] = `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}

