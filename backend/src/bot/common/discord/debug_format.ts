import type { AnyChannel, Guild, Member, User } from "oceanic.js";

export function debugFormatUser(user: User) {
	return `@${user.tag}[${user.id}]`;
}

export function debugFormatChannel(channel: AnyChannel) {
	let name = "<unnamed>";

	if ("name" in channel)
		name = channel.name ?? name;

	return `#${name}[${channel.id}]`;
}

export function debugFormatGuild(guild: Guild) {
	return `*${guild.name}[${guild.id}]`;
}

export function debugFormatPermissionContext(member: Member, channel: AnyChannel) {
	return `${debugFormatUser(member.user)} in ${debugFormatChannel(channel)}, ${debugFormatGuild(member.guild)}`;
}