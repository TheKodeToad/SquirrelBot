import { icons } from "../../icons.ts";
import { bot } from "../../index.ts";

export async function init_icons() {
	const emojis = await bot.application.getEmojis();
	for (const emoji of emojis.items)
		if (emoji.name in icons)
			icons[emoji.name] = `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
}
