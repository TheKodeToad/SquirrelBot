import { isTextableGuildChannel, isThreadChannel } from "#discord/common/general.ts";
import { bot } from "#discord/index.ts";
import { type AnyTextableGuildChannel, type AnyThreadChannel, DiscordRESTError, Guild, Member, PrivateChannel, type RequestGuildMembersOptions, type Uncached, User } from "oceanic.js";

export async function fetchUserCached(userID: string): Promise<User> {
	return bot.users.get(userID) ?? await bot.rest.users.get(userID);
}

export async function fetchUserCachedSupressed(userID: string): Promise<User | Uncached> {
	try {
		return await fetchUserCached(userID);
	} catch (error) {
		if (!(error instanceof DiscordRESTError))
			throw error;

		return { id: userID };
	}
}

export async function fetchMemberCached(guild: Guild, userID: string): Promise<Member> {
	return guild.members.get(userID) ?? await bot.rest.guilds.getMember(guild.id, userID);
}

export function fetchBotUserCached(guild: Guild): Promise<Member> {
	return fetchMemberCached(guild, bot.user.id);
}

export async function createDMCached(userID: string): Promise<PrivateChannel> {
	return bot.privateChannels.find(channel => channel.recipient.id === userID) ?? await bot.rest.users.createDM(userID);
}

export async function fetchThreadCached(guild: Guild, threadID: string): Promise<AnyThreadChannel | null> {
	const cached = guild.threads.get(threadID);

	if (cached !== undefined)
		return cached;

	if (bot.getChannel(threadID) !== undefined)
		return null;

	const fetched = await bot.rest.channels.get(threadID);

	if (!isThreadChannel(fetched))
		return null;

	if (fetched.guildID !== guild.id)
		return null;

	return fetched;
}

export async function fetchTextableGuildChannelCached(guild: Guild, channelID: string): Promise<AnyTextableGuildChannel | null> {
	const cachedRegularChannel = guild.channels.get(channelID);

	if (cachedRegularChannel !== undefined) {
		if (isTextableGuildChannel(cachedRegularChannel))
			return cachedRegularChannel;
		else
			return null;
	}

	const cachedThreadChannel = guild.threads.get(channelID);

	if (cachedThreadChannel !== undefined)
		return cachedThreadChannel;

	// must belong to another guild
	if (bot.getChannel(channelID))
		return null;

	const fetched = await bot.rest.channels.get(channelID);

	if (!isTextableGuildChannel(fetched))
		return null;

	if (fetched.guildID !== guild.id)
		return null;

	return fetched;
}

export async function fetchMembersCached(
	guild: Guild,
	userIDs: readonly string[],
	options?: Pick<RequestGuildMembersOptions, "presences" | "timeout">
): Promise<Map<string, Member>> {
	const result: Map<string, Member> = new Map;
	const queue: string[] = [];
	const promises: Promise<unknown>[] = [];

	const request = (): void => {
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

