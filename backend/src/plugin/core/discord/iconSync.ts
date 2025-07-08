import { onBotPreInit } from "#interface/discord/extensionPoints.ts";
import { bot } from "#interface/discord/index.ts";
import { icons } from "#plugin/core/discord/public/icons.ts";

export default [onBotPreInit(init)];

async function init(): Promise<void> {
	const emojis = await bot.application.getEmojis();
	for (const emoji of emojis.items)
		if (Object.hasOwn(icons, emoji.name))
			icons[emoji.name as keyof typeof icons] = `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}

