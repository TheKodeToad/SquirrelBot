import type { AnyChannel, Guild, Member, User } from "oceanic.js";

export function debug_format_user(user: User) {
	return `@${user.tag}[${user.id}]`;
}

export function debug_format_channel(channel: AnyChannel) {
	let name = "<unnamed>";

	if ("name" in channel)
		name = channel.name ?? name;

	return `#${name}[${channel.id}]`;
}

export function debug_format_guild(guild: Guild) {
	return `*${guild.name}[${guild.id}]`;
}

export function debug_format_permission_context(member: Member, channel: AnyChannel) {
	return `${debug_format_user(member.user)} in ${debug_format_channel(channel)}, ${debug_format_guild(member.guild)}`;
}