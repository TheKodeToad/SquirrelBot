import { mockMember } from "#common/discord/testing/mockMember.ts";
import { DUMMY_GUILD, mockSnowflake } from "#common/discord/testing/mockSnowflake.ts";
import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import type { CoreConfig } from "#plugin/core/config.ts";
import { coreConfigStore } from "#plugin/core/index.ts";
import { resolveGroups } from "#plugin/core/public/permissionResolution.ts";
import assert from "assert";
import { suite, test } from "node:test";
import { parse as parseTOML } from "smol-toml";
import { z } from "zod/v4";

function mockCoreConfig<T>(value: string, callback: (config: CoreConfig) => T): T {
	const parsed = coreConfigStore.schema.parse(parseTOML(value));

	coreConfigStore.set(DUMMY_GUILD, parsed);

	const result = callback(parsed);

	coreConfigStore.delete(DUMMY_GUILD);

	return result;
}

const Permissions = z.strictObject({
	permissions: z.object({}),
	permission_overrides: z.object(PermissionsFilter.shape).array(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mockCustomConfig(value: string): z.output<typeof Permissions> {
	return Permissions.parse(parseTOML(value));
}

suite("group resolution", () => {
	test("basic group resolution", () => {
		const mod = mockSnowflake();

		mockCoreConfig(
			`
			[groups.mod]
			roles = ["${mod}"]
			level = 50
			`,
			_ => {
				const resolved = resolveGroups(mockMember({ id: mockSnowflake(), guildID: DUMMY_GUILD, roles: [mod] }));
				assert.deepEqual(resolved, {
					groups: new Set(["mod"]),
					level: 50,
				});
			},
		);
	});
});
