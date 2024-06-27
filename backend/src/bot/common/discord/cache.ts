import { Guild, Member, PrivateChannel, RequestGuildMembersOptions, User } from "oceanic.js";
import { bot } from "../..";

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
