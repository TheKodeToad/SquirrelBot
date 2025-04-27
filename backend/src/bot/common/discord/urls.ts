import type { ImageFormat } from "oceanic.js";
import { bot } from "../../index.ts";

export function getChannelIconURL(channel: { id: string; icon?: string | null; }, format?: ImageFormat, size?: number): string | null {
	if (channel.icon == null)
		return null;

	return bot.util.formatImage(`/channel-icons/${channel.id}/${channel.icon}`, format, size);
}
