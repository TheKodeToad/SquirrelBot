import { bot } from "#interface/discord/index.ts";
import type { ImageFormat } from "oceanic.js";

export function getChannelIconURL(channel: { id: string; icon?: string | null; }, format?: ImageFormat, size?: number): string | null {
	if (channel.icon == null)
		return null;

	return bot.util.formatImage(`/channel-icons/${channel.id}/${channel.icon}`, format, size);
}
