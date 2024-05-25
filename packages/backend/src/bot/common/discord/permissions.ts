import { AnyGuildChannel, ChannelTypes, Member, Permissions, Role } from "oceanic.js";
import { bot } from "../..";

/**
 * Resolve member roles from cached guild.
 * This will throw if the guild is not cached.
 */
export function resolve_member_roles(member: Member): Role[] {
	return member.roles.map(id => member.guild.roles.get(id)!);
}

/**
 * Get the highest role a member has; otherwise the everyone role.
 * This will throw if the guild is not cached.
 */
export function get_highest_role(member: Member): Role {
	return [...resolve_member_roles(member), member.guild.roles.get(member.guildID)!]
		.reduce((prev, cur) => prev?.position > cur.position ? prev : cur);
}

export function can_write_in_channel(channel: AnyGuildChannel, member: Member): boolean {
	// channel was deleted
	if (bot.getChannel(channel.id) === undefined)
		return false;

	if (member.communicationDisabledUntil !== null && member.communicationDisabledUntil.getTime() >= Date.now())
		return false;

	const perms = channel.permissionsOf(member);

	switch (channel.type) {
		case ChannelTypes.GUILD_TEXT:
		case ChannelTypes.GUILD_ANNOUNCEMENT:
			return perms.has(Permissions.VIEW_CHANNEL | Permissions.SEND_MESSAGES);
		case ChannelTypes.GUILD_VOICE:
		case ChannelTypes.GUILD_STAGE_VOICE:
			return perms.has(Permissions.VIEW_CHANNEL | Permissions.CONNECT | Permissions.SEND_MESSAGES);
		case ChannelTypes.ANNOUNCEMENT_THREAD:
		case ChannelTypes.PUBLIC_THREAD:
		case ChannelTypes.PRIVATE_THREAD:
			return perms.has(Permissions.VIEW_CHANNEL | Permissions.SEND_MESSAGES_IN_THREADS)
				&& (!channel.threadMetadata.locked || perms.has(Permissions.MANAGE_THREADS));
		// these channel types can only have messages in child channels
		case ChannelTypes.GUILD_CATEGORY:
		case ChannelTypes.GUILD_FORUM:
		case ChannelTypes.GUILD_MEDIA:
			return false;
	}
}
