import { bot } from "../../index.ts";

export function getChannelIconURL(
	channel: { id: string; icon?: string | null; },
	format = bot.options.defaultImageFormat,
	size = bot.options.defaultImageSize
): string | null {
	if (channel.icon == null)
		return null;

	return `https://cdn.discordapp.com/channel-icons/${channel.id}/${channel.icon}.${format}?size=${size}`;
}