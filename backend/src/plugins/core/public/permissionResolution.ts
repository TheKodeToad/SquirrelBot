import {
	debugFormatChannel,
	debugFormatGuild,
	debugFormatUser,
} from "#common/discord/debugFormat.ts";
import { isThreadChannel } from "#common/discord/general.ts";
import { moduleLogger } from "#common/logger/index.ts";
import {
	NumberFilterMode,
	type NumberFilter,
} from "#common/schemas/numberFilter.ts";
import type { PermissionsFilter } from "#common/schemas/permissionsFilter.ts";
import type { CoreConfig, CoreGroup } from "#plugins/core/config.ts";
import { coreConfigStore } from "#plugins/core/index.ts";
import {
	CategoryChannel,
	Member,
	ThreadChannel,
	type AnyGuildChannel,
} from "oceanic.js";

const logger = moduleLogger();

interface GroupsResult {
	groups: Set<string>;
	level: number;
}

export function resolveGroups(member: Member): GroupsResult {
	const config: CoreConfig | undefined = coreConfigStore.get(member.guildID);

	const groups: Set<string> = new Set();
	let level = 0;

	if (config === undefined) {
		return { groups, level };
	}

	config.groups.forEach((group, id) => {
		if (!testGroup(group, member)) {
			return;
		}

		groups.add(id);

		if (groupLevel(group) > level) {
			level = groupLevel(group);
		}

		for (const reference of group.inherits) {
			const referencedGroup = config.groups.get(reference);

			if (referencedGroup === undefined) {
				continue;
			}

			groups.add(reference);

			if (groupLevel(referencedGroup) > level) {
				level = groupLevel(referencedGroup);
			}
		}
	});

	return { groups, level };
}

function groupLevel(group: CoreGroup): number {
	return group.level ?? 0;
}

function testGroup(group: CoreGroup, member: Member): boolean {
	if (group.users.includes(member.id)) {
		return true;
	}

	if (group.roles.some((role) => member.roles.includes(role))) {
		return true;
	}

	return false;
}

export interface ConfigWithPermissions<P extends Record<string, boolean> = {}> {
	defaultPermissions: P;
	permissionOverrides: (Partial<P> & PermissionsFilter)[];
}

export function resolvePermissions<P extends Record<string, boolean>>(
	config: ConfigWithPermissions<P>,
	member: Member,
	channel: Exclude<AnyGuildChannel, CategoryChannel>,
): P {
	const groups = resolveGroups(member);

	const result = { ...config.defaultPermissions };
	Object.setPrototypeOf(result, Object.prototype);

	const debugMatchedOverrides: number[] = [];

	for (const [i, override] of config.permissionOverrides.entries()) {
		if (!testFilter(override, groups, channel)) {
			continue;
		}

		debugMatchedOverrides.push(i);

		for (const key in override) {
			if (!Object.hasOwn(result, key)) {
				continue;
			}

			result[key as keyof typeof result] = override[key]!;
		}
	}

	logger.debug?.(
		`Resolved permissions for ${debugFormatUser(member.user)} ${debugFormatChannel(channel)} ${debugFormatGuild(member.guild)}`,
		{
			groups,
			defaultPermissions: config.defaultPermissions,
			permissionOverrides: config.permissionOverrides,
			matchedOverrides: debugMatchedOverrides,
			result,
		},
	);

	return result;
}

function testFilter(
	filter: PermissionsFilter,
	groups: GroupsResult,
	channel: Exclude<AnyGuildChannel, CategoryChannel>,
): boolean {
	const baseChannel = isThreadChannel(channel) ? channel.parent : channel;

	if (baseChannel === undefined) {
		throw new Error("Uncached thread parent channel");
	}

	const categoryChannel = baseChannel.parent ?? null;

	if (
		filter.inGroup !== undefined &&
		filter.inGroup.some((group) => groups.groups.has(group))
	) {
		return true;
	}

	if (filter.inChannel && filter.inChannel.includes(baseChannel.id)) {
		return true;
	}

	if (
		categoryChannel !== null &&
		filter.inChannelCategory &&
		filter.inChannelCategory.includes(categoryChannel.id)
	) {
		return true;
	}

	if (
		channel instanceof ThreadChannel &&
		filter.inThread &&
		filter.inThread.includes(channel.id)
	) {
		return true;
	}

	if (
		filter.level !== undefined &&
		testNumberFilter(filter.level, groups.level)
	) {
		return true;
	}

	return false;
}

function testNumberFilter(filter: NumberFilter, number: number): boolean {
	switch (filter.mode) {
		case NumberFilterMode.Equals:
			return number === filter.number;
		case NumberFilterMode.NotEquals:
			return number !== filter.number;
		case NumberFilterMode.LessThan:
			return number < filter.number;
		case NumberFilterMode.LessThanOrEqual:
			return number <= filter.number;
		case NumberFilterMode.GreaterThan:
			return number > filter.number;
		case NumberFilterMode.GreaterThanOrEqual:
			return number >= filter.number;
	}
}
