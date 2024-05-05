import { AnyGuildChannel, ChannelTypes, DiscordRESTError, Guild, Member, Permissions, PrivateChannel, RequestGuildMembersOptions, Role, User } from "oceanic.js";
import { bot } from "..";
import { escape_all } from "./markdown";

export function format_rest_error(rest_error: DiscordRESTError) {
	if (rest_error.resBody !== null
		&& typeof rest_error.resBody.message === "string") {
		return `API Error ${rest_error.code}: ${rest_error.resBody.message}`;
	}

	return `HTTP Error ${rest_error.status}: ${rest_error.statusText}`;
}

export function get_user_cached(user_id: string): User | Promise<User> {
	return bot.users.get(user_id) ?? bot.rest.users.get(user_id);
}

export function get_member_cached(guild: Guild, user_id: string): Member | Promise<Member> {
	return guild.members.get(user_id) ?? bot.rest.guilds.getMember(guild.id, user_id);
}

export function get_bot_user_cached(guild: Guild): Member | Promise<Member> {
	return get_member_cached(guild, bot.user.id);
}

export function create_dm_cached(user_id: string): PrivateChannel | Promise<PrivateChannel> {
	return bot.privateChannels.find(channel => channel.recipient.id === user_id) ?? bot.rest.users.createDM(user_id);
}

export async function request_members_cached(
	guild: Guild,
	user_ids: string[],
	options?: Pick<RequestGuildMembersOptions, "presences" | "timeout">
): Promise<Map<string, Member>> {
	const result: Map<string, Member> = new Map;
	const queue: string[] = [];
	let promises: Promise<unknown>[] = [];

	const request = () => {
		promises.push(
			guild.shard.requestGuildMembers(guild.id, {
				userIDs: queue,
				...options,
			}).then(members => members.forEach(member => result.set(member.id, member)))
		);
		queue.length = 0;
	};

	for (const id of user_ids) {
		const member = guild.members.get(id);
		if (member !== undefined)
			result.set(id, member);
		else {
			queue.push(id);
			if (queue.length === 100)
				request();
		}
	}

	if (queue.length > 0)
		request();

	await Promise.all(promises);
	return result;
}

/**
 * <@id> (name or <unknown>)
 */
export async function format_user(user_id: string, quiet = true) {
	let name = "<unknown>";

	try {
		name = (await get_user_cached(user_id)).tag;
	} catch (error) {
		if (!(error instanceof DiscordRESTError))
			throw error;

		if (!quiet)
			throw error;
	}

	return `<@${user_id}> (${escape_all(name)})`;
}

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
