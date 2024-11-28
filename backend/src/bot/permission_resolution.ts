import { AnyGuildChannel, CategoryChannel, Member, ThreadChannel, User } from "oceanic.js";
import { CoreConfig, CoreGroup } from "../schema/core/config";
import { core_config } from "./plugin/core";

interface GroupsResult {
	groups: Set<string>;
	level: number;
}

export function resolve_groups(member: Member, channel: AnyGuildChannel): GroupsResult {
	const config: CoreConfig | undefined = core_config.get(member.guildID);

	const groups: Set<string> = new Set;
	let level = 0;

	if (config === undefined)
		return { groups, level };

	const roles: Set<string> = new Set(member.roles);

	for (const id in config.groups) {
		if (!Object.hasOwn(config.groups, id))
			continue;

		if (groups.has(id))
			continue;

		const group = config.groups[id]!;

		if (!test_group(group, member.user, roles, channel))
			continue;

		groups.add(id);

		if (group_level(group) > level)
			level = group_level(group);

		for (const reference of group.inherits) {
			if (!Object.hasOwn(config.groups, id))
				continue;

			groups.add(reference);

			const referenced_group = config.groups[id]!;

			if (group_level(referenced_group) > level)
				level = group_level(referenced_group);
		}
	}

	return { groups, level };
}

function group_level(group: CoreGroup) {
	return group.level ?? 0;
}

function test_group(group: CoreGroup, user: User, roles: Set<string>, channel: AnyGuildChannel): boolean {
	// child of thread
	let base_channel: AnyGuildChannel | null = null;
	// category holding channel, or supplied channel if it is a category
	let category: CategoryChannel | null = null;

	if (channel instanceof CategoryChannel)
		category = channel;
	else {
		base_channel = channel;

		while (base_channel.parent !== null) {
			if (base_channel.parent instanceof CategoryChannel) {
				category = base_channel.parent;
				break;
			}

			base_channel = base_channel.parent!;
		}
	}

	if (group.users.includes(user.id))
		return true;

	if (group.roles.some(role => roles.has(role)))
		return true;

	if (base_channel !== null && group.channels.includes(base_channel.id))
		return true;

	if (channel instanceof ThreadChannel && group.threads.includes(channel.id))
		return true;

	if (category !== null && group.channel_categories.includes(category.id))
		return true;

	return false;
}
