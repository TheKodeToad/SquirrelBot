import { Snowflake } from "#common/schema/general.ts";
import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import { z } from "zod/v4";

const CoreGroup = z.strictObject({
	users: Snowflake.array().default([]),
	roles: Snowflake.array().default([]),
	inherits: Snowflake.array().default([]),
	level: z.int().optional(),
});
export interface CoreGroup extends z.output<typeof CoreGroup> { }

const CoreGroups = z.record(z.string(), CoreGroup).transform(transformCoreGroups);
export type CoreGroups = z.output<typeof CoreGroups>;

export const CoreConfig = z.strictObject({
	groups: CoreGroups.prefault({}).describe(
		"Declare permission groups. " +
		"Permission groups are used to assign permissions to users — " +
		"for example, you can create a permission group for admins called 'admin' " +
		"and assign it using a permission override which matches it."
	),

	prefix_commands: z.strictObject({
		prefix: z.string().default("?"),
		reply: z.boolean().default(true)
			.describe("Reply to messages invoking commands. The bot must have 'Read Message History' permissions.")
	}).prefault({}),

	default_permissions: z.strictObject({
		prefix_commands: z.boolean().default(true),
		slash_commands: z.boolean().default(true),
		ephemeral_response: z.boolean().default(true),
		about_command: z.boolean().default(true),
		help_command: z.boolean().default(true),
		groups_command: z.boolean().default(false),
	}).prefault({}),
	permission_overrides: z.strictObject({
		prefix_commands: z.boolean().optional(),
		slash_commands: z.boolean().optional(),
		ephemeral_response: z.boolean().optional(),
		about_command: z.boolean().optional(),
		help_command: z.boolean().optional(),
		groups_command: z.boolean().optional(),
		...PermissionsFilter.shape
	}).array().default([]),
});
export type CoreConfig = z.output<typeof CoreConfig>;

const MAX_INHERITANCE_DEPTH = 1000;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function transformCoreGroups(input: Record<string, CoreGroup>, ctx: z.RefinementCtx<Record<string, CoreGroup>>) {
	// show all errors for invalid inherits references at once
	let hasIssues = false;

	for (const key in input) {
		if (!Object.hasOwn(input, key))
			continue;

		const value = input[key]!;

		value.inherits?.forEach((reference, index) => {
			if (!Object.hasOwn(input, reference)) {
				ctx.addIssue({
					message: `Invalid group reference: Received ${reference}`,
					path: [key, "inherits", index]
				});
				hasIssues = true;
			}
		});
	}

	if (hasIssues)
		return z.NEVER;

	const result: Map<string, CoreGroup> = new Map;

	for (const key in input) {
		if (!Object.hasOwn(input, key))
			continue;

		const value = input[key]!;

		const inherits = flattenInheritence(value, key, input);

		if (inherits === null) {
			ctx.addIssue({
				message: `Maximum inheritance depth reached: no more than ${MAX_INHERITANCE_DEPTH} levels of inheritance are allowed`,
				path: [key, "inherits"]
			});
			return z.NEVER;
		}

		result.set(key, { ...value, inherits });
	}

	return result;
}

function flattenInheritence(input: CoreGroup, key: string, groups: Record<string, CoreGroup>): string[] | null {
	const output: string[] = [];

	if (!_flattenInheritence(input, output, key, groups, 0))
		return null;

	return output;
}

function _flattenInheritence(input: CoreGroup, output: string[], root: string, groups: Record<string, CoreGroup>, depth: number): boolean {
	if (depth > MAX_INHERITANCE_DEPTH)
		return false;

	for (const reference of input.inherits) {
		if (reference === root || output.includes(reference))
			continue;

		if (!Object.hasOwn(groups, reference))
			throw new Error("Bad group reference: " + reference);

		output.push(reference);

		const referencedGroup = groups[reference]!;

		if (!_flattenInheritence(referencedGroup, output, root, groups, depth + 1))
			return false;
	}

	return true;
}
