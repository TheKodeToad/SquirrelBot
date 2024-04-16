import { Member, Role } from "oceanic.js";

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
	console.log([...resolve_member_roles(member), member.guild.roles.get(member.guildID)!]);
	return [...resolve_member_roles(member), member.guild.roles.get(member.guildID)!]
		.reduce((prev, cur) => prev?.position > cur.position ? prev : cur);
}
