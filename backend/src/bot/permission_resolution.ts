import { type AnyGuildChannel, CategoryChannel, Member, ThreadChannel } from "oceanic.js";
import { test_number_filter } from "../schema/common/number_filter.ts";
import type { PermissionsFilter } from "../schema/common/permissions_filter.ts";
import type { CoreConfig, CoreGroup } from "../schema/core.ts";
import { core_config } from "./plugin/core/index.ts";

interface GroupsResult {
	groups: Set<string>;
	level: number;
}

export function resolve_groups(member: Member): GroupsResult {
	const config: CoreConfig | undefined = core_config.get(member.guildID);

	const groups: Set<string> = new Set;
	let level = 0;

	if (config === undefined)
		return { groups, level };

	for (const id in config.groups) {
		if (!Object.hasOwn(config.groups, id))
			continue;

		if (groups.has(id))
			continue;

		const group = config.groups[id]!;

		if (!test_group(group, member))
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

function test_group(group: CoreGroup, member: Member): boolean {
	if (group.users.includes(member.id))
		return true;

	if (group.roles.some(role => member.roles.includes(role)))
		return true;

	return false;
}

export function resolve_permissions<P extends Record<string, boolean>>(
	config: {
		default_permissions: P,
		permission_overrides: (Partial<P> & PermissionsFilter)[];
	},
	member: Member,
	channel: Exclude<AnyGuildChannel, CategoryChannel>
): Record<keyof P, boolean> {
	const groups = resolve_groups(member);

	const result: Record<string, boolean> = {};

	for (const key in config.default_permissions) {
		Object.defineProperty(result, key, {
			value: config.default_permissions[key]!,
			configurable: true,
			enumerable: true,
			writable: true
		});
	}

	for (const override of config.permission_overrides) {
		if (!test_filter(override, groups, channel))
			continue;

		for (const key in override) {
			if (!Object.hasOwn(result, key))
				continue;

			result[key] = override[key]!;
		}
	}

	return result as any;
}

function test_filter(filter: PermissionsFilter, groups: GroupsResult, channel: Exclude<AnyGuildChannel, CategoryChannel>) {
	const base_channel = channel instanceof ThreadChannel ? channel.parent! : channel;
	const category_channel = base_channel.parent ?? null;

	if (filter.in_group !== undefined && filter.in_group.some(group => groups.groups.has(group)))
		return true;

	if (filter.in_channel && filter.in_channel.includes(base_channel.id))
		return true;

	if (category_channel !== null && filter.in_channel_category && filter.in_channel_category.includes(category_channel.id))
		return true;

	if (channel instanceof ThreadChannel && filter.in_thread && filter.in_thread.includes(channel.id))
		return true;

	if (filter.level !== undefined && test_number_filter(filter.level, groups.level))
		return true;

	return false;
}