import { mockMember } from "#bot/common/tests/mockMember.ts";
import { DUMMY_GUILD, mockSnowflake } from "#bot/common/tests/mockSnowflake.ts";
import { coreConfig } from "#bot/plugin/core/index.ts";
import { resolveGroups } from "#bot/plugin/core/public/permissionResolution.ts";
import { PermissionsFilter } from "#schema/common/permissionsFilter.ts";
import type { CoreConfig } from "#schema/plugin/core.ts";
import assert from "assert";
import { suite, test } from "node:test";
import { parse as parseTOML } from "smol-toml";
import { array, object, parse, type InferOutput } from "valibot";

function mockCoreConfig<T>(value: string, callback: (config: CoreConfig) => T): T {
	const parsed = parse(coreConfig.schema, parseTOML(value));

	coreConfig.set(DUMMY_GUILD, parsed);

	const result = callback(parsed);

	coreConfig.delete(DUMMY_GUILD);

	return result;
}

const permissionsSchema = object({
	permissions: object({}),
	permission_overrides: array(PermissionsFilter),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mockCustomConfig(value: string): InferOutput<typeof permissionsSchema> {
	return parse(permissionsSchema, parseTOML(value));
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
