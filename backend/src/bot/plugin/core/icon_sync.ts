import { bot } from "../../index.ts";
import { icons } from "./public/icons.ts";

export async function init_icons() {
	const emojis = await bot.application.getEmojis();
	for (const emoji of emojis.items)
		if (Object.hasOwn(icons, emoji.name))
			icons[emoji.name as keyof typeof icons] = `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}

