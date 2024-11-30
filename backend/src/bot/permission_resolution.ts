import { AnyGuildChannel, CategoryChannel, Member, ThreadChannel, User } from "oceanic.js";
import { test_number_filter } from "../schema/common/number_filter";
import { PermissionsFilter } from "../schema/common/permissions_filter";
import { CoreConfig, CoreGroup } from "../schema/core/config";
import { core_config } from "./plugin/core";

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

interface GroupsResult {
	groups: Set<string>;
	level: number;
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

export function resolve_permissions<P extends Record<string, boolean>>(
	config: {
		default_permissions: P,
		permission_overrides: (Partial<P> & PermissionsFilter)[];
	},
	member: Member,
	channel: AnyGuildChannel
): P {
	const groups = resolve_groups(member, channel);

	const result: Record<string, boolean> = {};

	for (const key in config.default_permissions)
		Object.defineProperty(result, key, {
			value: config.default_permissions[key]!,
			configurable: true,
			enumerable: true,
			writable: true
		});

	for (const override of config.permission_overrides) {
		if (!test_filter(override, groups))
			continue;

		for (const key in override) {
			if (!Object.hasOwn(result, key))
				continue;

			result[key] = override[key]!;
		}
	}

	return result as any;
}

export function test_filter(filter: PermissionsFilter, groups: GroupsResult) {
	if (filter.in_group !== undefined && groups.groups.has(filter.in_group))
		return true;

	if (filter.level !== undefined && test_number_filter(filter.level, groups.level))
		return true;

	return false;
}