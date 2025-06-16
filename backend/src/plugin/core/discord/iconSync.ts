import { bot } from "#discord/index.ts";
import { icons } from "#plugin/core/public/discord/icons.ts";

export async function initIcons(): Promise<void> {
	const emojis = await bot.application.getEmojis();
	for (const emoji of emojis.items)
		if (Object.hasOwn(icons, emoji.name))
			icons[emoji.name as keyof typeof icons] = `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}

