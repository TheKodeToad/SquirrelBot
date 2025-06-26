import { mockMember } from "#common/discord/testing/mockMember.ts";
import { DUMMY_GUILD, mockSnowflake } from "#common/discord/testing/mockSnowflake.ts";
import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import type { CoreConfig } from "#plugin/core/config.ts";
import { coreConfigStore } from "#plugin/core/index.ts";
import { resolveGroups } from "#plugin/core/public/discord/permissionResolution.ts";
import assert from "assert";
import { suite, test } from "node:test";
import { parse as parseTOML } from "smol-toml";
import { array, object, parse, strictObject, type InferOutput } from "valibot";

function mockCoreConfig<T>(value: string, callback: (config: CoreConfig) => T): T {
	const parsed = parse(coreConfigStore.schema, parseTOML(value));

	coreConfigStore.set(DUMMY_GUILD, parsed);

	const result = callback(parsed);

	coreConfigStore.delete(DUMMY_GUILD);

	return result;
}

const permissionsSchema = strictObject({
	permissions: object({}),
	permission_overrides: array(object(PermissionsFilter.entries)),
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
