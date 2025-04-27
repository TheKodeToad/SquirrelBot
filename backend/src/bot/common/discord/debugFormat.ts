import type { AnyChannel, Guild, Member, Uncached, User } from "oceanic.js";
import { bot } from "../../index.ts";

export function debugFormatUser(user: User): string {
	return `@${user.tag}[${user.id}]`;
}

export function debugFormatChannel(channel: AnyChannel): string {
	let name = "<unnamed>";

	if ("name" in channel)
		name = channel.name ?? name;

	return `#${name}[${channel.id}]`;
}

export function debugFormatGuildByID(id: string): string {
	return debugFormatGuild(bot.guilds.get(id) ?? { id });
}

export function debugFormatGuild(guild: Guild | Uncached): string {
	let name = "<unknown>";

	if ("name" in guild)
		name = guild.name;

	return `*${name}[${guild.id}]`;
}

export function debugFormatPermissionContext(member: Member, channel: AnyChannel): string {
	return `${debugFormatUser(member.user)} in ${debugFormatChannel(channel)}, ${debugFormatGuild(member.guild)}`;
}
