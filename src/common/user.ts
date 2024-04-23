import { DiscordRESTError, Member, Role } from "oceanic.js";
import { get_user_cached } from "./rest";

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

	return `<@${user_id}> (${name})`;
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
