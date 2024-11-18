import { AnyGuildChannel, CategoryChannel, Member, ThreadChannel, User } from "oceanic.js";
import { CoreConfig, CoreGroup } from "../schema/core/config";
import { core_config } from "./plugin/core";

export function resolve_groups(member: Member, channel: AnyGuildChannel): Set<CoreGroup> {
	const config: CoreConfig | undefined = core_config.get(member.guildID);

	if (config === undefined)
		return new Set;

	const roles: Set<string> = new Set(member.roles);
	const result: Set<CoreGroup> = new Set;

	for (const id in config.groups) {
		const group = config.groups[id]!;

		if (result.has(group))
			continue;

		if (test_group(group, member.user, roles, channel)) {
			result.add(group);

			for (const reference of group.inherits) {
				const referenced_group = config.groups[reference];

				if (referenced_group !== undefined)
					result.add(referenced_group);
			}
		}
	}

	return result;
}

export function test_group(group: CoreGroup, user: User, roles: Set<string>, channel: AnyGuildChannel): boolean {
	let base_channel: AnyGuildChannel | null = null;

	if (channel instanceof ThreadChannel)
		base_channel = channel.parent!;
	else if (!(channel instanceof CategoryChannel))
		base_channel = channel;

	let category_channel: CategoryChannel | null = null;

	if (channel instanceof CategoryChannel)
		category_channel = channel;
	else if (base_channel !== null && base_channel.parent instanceof CategoryChannel)
		category_channel = base_channel.parent;

	if (group.users.includes(user.id))
		return true;

	if (group.roles.some(role => roles.has(role)))
		return true;

	if (base_channel !== null && group.channels.includes(base_channel.id))
		return true;

	if (channel instanceof ThreadChannel && group.threads.includes(channel.id))
		return true;

	if (category_channel !== null && group.channel_categories.includes(category_channel.id)) {
		return true;
	}

	return false;
}

// export function resolve_permissions<P extends {}>(
// 	config: { default_permissions: P, permission_overrides: (Partial<P> & PermissionsFilter)[]; },
// 	member: Member,
// 	channel: AnyGuildChannel
// ): P {
// 	const result: Record<string, unknown> = {};

// 	for (const key in config.default_permissions)
// 		Object.defineProperty(result, key, { value: config.default_permissions });

// 	for (const override of config.permission_overrides) {

// 	}

// 	return result as any;
// }
