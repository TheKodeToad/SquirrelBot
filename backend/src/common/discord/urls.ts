import { Client, Routes, type ImageFormat } from "oceanic.js";

export function getChannelIconURL(bot: Client, channel: { id: string; icon?: string | null; }, format?: ImageFormat, size?: number): string | null {
	if (channel.icon == null) {
		return null;
	}

	return bot.util.formatImage(`/channel-icons/${channel.id}/${channel.icon}`, format, size);
}

// based on User.defaultAvatar and defaultAvatarURL
export function getDefaultAvatarURL(bot: Client, id: bigint) {
	return bot.util.formatImage(Routes.EMBED_AVATAR(Number(id >> 22n) % 6));
}
