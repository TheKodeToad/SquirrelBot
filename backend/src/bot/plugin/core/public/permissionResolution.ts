import { type AnyGuildChannel, CategoryChannel, Member, ThreadChannel } from "oceanic.js";
import { moduleLogger } from "../../../../common/logger/index.ts";
import { testNumberFilter } from "../../../../schema/common/numberFilter.ts";
import type { PermissionsFilter } from "../../../../schema/common/permissionsFilter.ts";
import type { CoreConfig, CoreGroup } from "../../../../schema/plugin/core.ts";
import { debugFormatChannel, debugFormatGuild, debugFormatUser } from "../../../common/discord/debugFormat.ts";
import { isThreadChannel } from "../../../common/discord/typeGuards.ts";
import { coreConfig } from "../index.ts";

const logger = moduleLogger();

interface GroupsResult {
	groups: Set<string>;
	level: number;
}

export function resolveGroups(member: Member): GroupsResult {
	const config: CoreConfig | undefined = coreConfig.get(member.guildID);

	const groups: Set<string> = new Set;
	let level = 0;

	if (config === undefined)
		return { groups, level };

	config.groups.forEach((group, id) => {
		if (!testGroup(group, member))
			return;

		groups.add(id);

		if (groupLevel(group) > level)
			level = groupLevel(group);

		for (const reference of group.inherits) {
			const referencedGroup = config.groups.get(reference);

			if (referencedGroup === undefined)
				continue;

			groups.add(reference);

			if (groupLevel(referencedGroup) > level)
				level = groupLevel(referencedGroup);
		}
	});

	return { groups, level };
}

function groupLevel(group: CoreGroup) {
	return group.level ?? 0;
}

function testGroup(group: CoreGroup, member: Member): boolean {
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

export function resolvePermissions<P extends Record<string, boolean>>(
	config: ConfigWithPermissions<P>,
	member: Member,
	channel: Exclude<AnyGuildChannel, CategoryChannel>
): P {
	const groups = resolveGroups(member);

	const result = { ...config.default_permissions };
	Object.setPrototypeOf(result, Object.prototype);

	const debugMatchedOverrides: number[] = [];

	for (const [i, override] of config.permission_overrides.entries()) {
		if (!testFilter(override, groups, channel))
			continue;

		debugMatchedOverrides.push(i);

		for (const key in override) {
			if (!Object.hasOwn(result, key))
				continue;

			result[key as keyof typeof result] = override[key]!;
		}
	}

	logger.debug?.(`Resolved permissions for ${debugFormatUser(member.user)} ${debugFormatChannel(channel)} ${debugFormatGuild(member.guild)}`, {
		groups,
		defaultPermissions: config.default_permissions,
		permissionOverrides: config.permission_overrides,
		matchedOverrides: debugMatchedOverrides,
		result
	});

	return result;
}

function testFilter(filter: PermissionsFilter, groups: GroupsResult, channel: Exclude<AnyGuildChannel, CategoryChannel>) {
	const baseChannel = isThreadChannel(channel) ? channel.parent : channel;

	if (baseChannel === undefined)
		throw new Error("Uncached thread parent channel");

	const categoryChannel = baseChannel.parent ?? null;

	if (filter.in_group !== undefined && filter.in_group.some(group => groups.groups.has(group)))
		return true;

	if (filter.in_channel && filter.in_channel.includes(baseChannel.id))
		return true;

	if (categoryChannel !== null && filter.in_channel_category && filter.in_channel_category.includes(categoryChannel.id))
		return true;

	if (channel instanceof ThreadChannel && filter.in_thread && filter.in_thread.includes(channel.id))
		return true;

	if (filter.level !== undefined && testNumberFilter(filter.level, groups.level))
		return true;

	return false;
}
