import { type AnyThreadChannel, Guild, Member, PrivateChannel, type RequestGuildMembersOptions, ThreadChannel, User } from "oceanic.js";
import { bot } from "../../index.ts";

export async function getUserCached(userID: string): Promise<User> {
	return bot.users.get(userID) ?? await bot.rest.users.get(userID);
}

export async function getMemberCached(guild: Guild, userID: string): Promise<Member> {
	return guild.members.get(userID) ?? await bot.rest.guilds.getMember(guild.id, userID);
}

export function getBotUserCached(guild: Guild): Promise<Member> {
	return getMemberCached(guild, bot.user.id);
}

export async function createDMCached(userID: string): Promise<PrivateChannel> {
	return bot.privateChannels.find(channel => channel.recipient.id === userID) ?? await bot.rest.users.createDM(userID);
}

export async function getThreadCached(guild: Guild, threadID: string): Promise<AnyThreadChannel | null> {
	const cached = guild.threads.get(threadID);

	if (cached !== undefined)
		return cached;

	if (guild.channels.has(threadID))
		return null;

	const fetched = await bot.rest.channels.get(threadID);

	if (fetched instanceof ThreadChannel)
		return fetched;

	return null;
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

