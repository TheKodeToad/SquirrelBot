import { bot } from "../..";

export async function init_icons() {
	const icons = await bot.application.getEmojis();
	for (const icon of icons.items) {
		if (icon.name in icons)
			icons[icon.name] = icon;
	}
}
