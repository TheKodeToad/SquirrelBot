import { Guild, Member, PrivateChannel, type RequestGuildMembersOptions, User } from "oceanic.js";
import { bot } from "../../index.ts";

export function getUserCached(userID: string): User | Promise<User> {
	return bot.users.get(userID) ?? bot.rest.users.get(userID);
}

export function getMemberCached(guild: Guild, userID: string): Member | Promise<Member> {
	return guild.members.get(userID) ?? bot.rest.guilds.getMember(guild.id, userID);
}

export function getBotUserCached(guild: Guild): Member | Promise<Member> {
	return getMemberCached(guild, bot.user.id);
}

export function createDMCached(userID: string): PrivateChannel | Promise<PrivateChannel> {
	return bot.privateChannels.find(channel => channel.recipient.id === userID) ?? bot.rest.users.createDM(userID);
}

export async function requestMembersCached(
	guild: Guild,
	userIDs: readonly string[],
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

	for (const id of userIDs) {
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
