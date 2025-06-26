import { Snowflake } from "#common/schema/general.ts";
import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import type { InferOutput } from "valibot";
import { array, boolean, description, number, object, optional, pipe, rawTransform, record, string } from "valibot";

const CoreGroup = object({
	users: optional(array(pipe(string(), Snowflake)), []),
	roles: optional(array(pipe(string(), Snowflake)), []),
	inherits: optional(array(string()), []),
	level: optional(number())
});
export interface CoreGroup extends InferOutput<typeof CoreGroup> { }

const CoreGroups = pipe(
	record(
		string(),
		CoreGroup
	),
	transformCoreGroups()
);
export type CoreGroups = InferOutput<typeof CoreGroups>;

export const CoreConfig = object({
	groups: pipe(
		optional(CoreGroups, {}),
		description(
			"Declare permission groups. " +
			"Permission groups are used to assign permissions to users —" +
			"for example, create a permission group for admins called 'admin' " +
			"and assign it using a permission override which matches it."
		)
	),

	prefix_commands: optional(object({
		prefix: optional(string(), "?"),
		reply: pipe(
			optional(boolean(), true),
			description("Reply to messages invoking commands. The bot must have 'Read Message History' permissions.")
		),
	}), {}),

	default_permissions: optional(object({
		prefix_commands: optional(boolean(), true),
		slash_commands: optional(boolean(), true),
		ephemeral_response: optional(boolean(), true),
		about_command: optional(boolean(), true),
		help_command: optional(boolean(), true),
		groups_command: optional(boolean(), false)
	}), {}),
	permission_overrides: optional(array(object({
		prefix_commands: optional(boolean()),
		slash_commands: optional(boolean()),
		ephemeral_response: optional(boolean()),
		about_command: optional(boolean()),
		help_command: optional(boolean()),
		groups_command: optional(boolean()),
		...PermissionsFilter.entries
	})), []),
});
export type CoreConfig = InferOutput<typeof CoreConfig>;

const MAX_INHERITANCE_DEPTH = 1000;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function transformCoreGroups() {
	return rawTransform<Record<string, CoreGroup>, Map<string, CoreGroup>>(({ dataset, addIssue, NEVER }) => {
		if (!dataset.typed)
			return NEVER;

		// show all errors for invalid inherits references at once
		let hasIssues = false;

		for (const key in dataset.value) {
			if (!Object.hasOwn(dataset.value, key))
				continue;

			const value = dataset.value[key]!;

			value.inherits?.forEach((reference, index) => {
				if (!Object.hasOwn(dataset.value, reference)) {
					addIssue({
						message: `Invalid group reference: Received ${reference}`,
						path: [
							{ type: "object", origin: "value", input: dataset.value, key, value },
							{ type: "object", origin: "value", input: value, key: "inherits", value: value.inherits },
							{ type: "array", origin: "value", input: value.inherits, key: index, value: reference }
						]
					});
					hasIssues = true;
				}
			});
		}

		if (hasIssues)
			return NEVER;

		const result: Map<string, CoreGroup> = new Map;

		for (const key in dataset.value) {
			if (!Object.hasOwn(dataset.value, key))
				continue;

			const value = dataset.value[key]!;

			const inherits = flattenInheritence(value, key, dataset.value);

			if (inherits === null) {
				addIssue({
					message: `Maximum inheritance depth reached: no more than ${MAX_INHERITANCE_DEPTH} levels of inheritance are allowed`,
					path: [
						{ type: "object", origin: "value", input: dataset.value, key, value },
						{ type: "object", origin: "value", input: value, key: "inherits", value: value.inherits },
					]
				});
				return NEVER;
			}

			result.set(key, { ...value, inherits });
		}

		return result;
	});
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
