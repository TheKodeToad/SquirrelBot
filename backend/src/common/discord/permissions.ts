import { type AnyGuildChannel, ChannelTypes, GuildMemberFlags, Member, Permissions, Role, Client } from "oceanic.js";

/**
 * Resolve member roles from cached guild.
 * This will throw if the guild is not cached.
 */
export function resolveMemberRoles(member: Member): Role[] {
	return member.roles.map(id => member.guild.roles.get(id)!);
}

/**
 * Get the highest role a member has; otherwise the everyone role.
 * This will throw if the guild is not cached.
 */
export function getHighestRole(member: Member): Role {
	return [...resolveMemberRoles(member), member.guild.roles.get(member.guildID)!]
		.reduce((prev, cur) => prev?.position > cur.position ? prev : cur);
}

const QUARANTINE = GuildMemberFlags.AUTOMOD_QUARANTINED_BIO | GuildMemberFlags.AUTOMOD_QUARANTINED_CLAN_TAG | GuildMemberFlags.AUTOMOD_QUARANTINED_USERNAME_OR_GUILD_NICKNAME;

export function canWriteInChannel(bot: Client, channel: AnyGuildChannel, member: Member): boolean {
	// channel was deleted
	if (bot.getChannel(channel.id) === undefined) {
		return false;
	}

	if (member.pending) {
		return false;
	}

	if ((member.flags & QUARANTINE) !== 0)
		return false;

	if (member.permissions.has(Permissions.ADMINISTRATOR))
		return true;

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

	(channel satisfies never);

	return false;
}
