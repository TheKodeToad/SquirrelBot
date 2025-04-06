import { type AnyGuildChannel, CategoryChannel, Member, ThreadChannel } from "oceanic.js";
import { module_logger } from "../../../../common/logger/index.ts";
import { test_number_filter } from "../../../../schema/common/number_filter.ts";
import type { PermissionsFilter } from "../../../../schema/common/permissions_filter.ts";
import type { CoreConfig, CoreGroup } from "../../../../schema/core.ts";
import { debug_format_channel, debug_format_guild, debug_format_user } from "../../../common/discord/debug_format.ts";
import { core_config } from "../index.ts";

const logger = module_logger();

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

	config.groups.forEach((group, id) => {
		if (!test_group(group, member))
			return;

		groups.add(id);

		if (group_level(group) > level)
			level = group_level(group);

		for (const reference of group.inherits) {
			const referenced_group = config.groups.get(reference);

			if (referenced_group === undefined)
				continue;

			groups.add(reference);

			if (group_level(referenced_group) > level)
				level = group_level(referenced_group);
		}
	});

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

export interface ConfigWithPermissions<P extends Record<string, boolean> = {}> {
	default_permissions: P,
	permission_overrides: (Partial<P> & PermissionsFilter)[];
}

export function resolve_permissions<P extends Record<string, boolean>>(
	config: ConfigWithPermissions<P>,
	member: Member,
	channel: Exclude<AnyGuildChannel, CategoryChannel>
): P {
	const groups = resolve_groups(member);

	const result = { ...config.default_permissions };
	Object.setPrototypeOf(result, Object.prototype);

	const debug_matched_overrides: number[] = [];

	for (const [i, override] of config.permission_overrides.entries()) {
		if (!test_filter(override, groups, channel))
			continue;

		debug_matched_overrides.push(i);

		for (const key in override) {
			if (!Object.hasOwn(result, key))
				continue;

			result[key as keyof typeof result] = override[key]!;
		}
	}

	logger.debug(`Resolved permissions for ${debug_format_user(member.user)} ${debug_format_channel(channel)} ${debug_format_guild(member.guild)}`, {
		groups,
		default_permissions: config.default_permissions,
		permission_overrides: config.permission_overrides,
		matched_overrides: debug_matched_overrides,
		result
	});

	return result;
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