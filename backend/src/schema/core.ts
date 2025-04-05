import type { InferOutput } from "valibot";
import { array, boolean, number, object, optional, pipe, rawTransform, record, regex, string } from "valibot";
import { SNOWFLAKE_REGEX } from "../common/snowflake.ts";
import { permissions_filter_schema } from "./common/permissions_filter.ts";

const core_group_schema = object({
	users: optional(array(pipe(string(), regex(SNOWFLAKE_REGEX, "invalid user ID"))), []),
	roles: optional(array(pipe(string(), regex(SNOWFLAKE_REGEX, "invalid role ID"))), []),
	inherits: optional(array(string()), []),
	level: optional(number())
});
export interface CoreGroup extends InferOutput<typeof core_group_schema> { }

const core_groups_schema = pipe(
	record(
		string(),
		core_group_schema
	),
	transform_core_groups()
);
export interface CoreGroups extends InferOutput<typeof core_groups_schema> { }

export const core_config_schema = object({
	groups: optional(core_groups_schema, {}),

	prefix_commands: optional(object({
		prefix: optional(string(), "?"),
		reply: optional(boolean(), true),
	}), {}),

	default_permissions: optional(object({
		prefix_commands: optional(boolean(), true),
		slash_commands: optional(boolean(), true),
		about_command: optional(boolean(), true),
		groups_command: optional(boolean(), false)
	}), {}),
	permission_overrides: optional(array(object({
		prefix_commands: optional(boolean()),
		slash_commands: optional(boolean()),
		about_command: optional(boolean()),
		groups_command: optional(boolean()),
		...permissions_filter_schema.entries
	})), []),
});
export interface CoreConfig extends InferOutput<typeof core_config_schema> { }

const MAX_INHERITANCE_DEPTH = 1000;

function transform_core_groups() {
	return rawTransform<Record<string, CoreGroup>, Map<string, CoreGroup>>(({ dataset, addIssue, NEVER }) => {
		if (!dataset.typed)
			return NEVER;

		// show all errors for invalid inherits references at once
		let has_issues = false;

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
							{ type: "array", origin: "value", input: value.inherits!, key: index, value: reference }
						]
					});
					has_issues = true;
				}
			});
		}

		if (has_issues)
			return NEVER;

		let result: Map<string, CoreGroup> = new Map;

		for (const key in dataset.value) {
			if (!Object.hasOwn(dataset.value, key))
				continue;

			const value = dataset.value[key]!;

			const inherits = flatten_inheritance(value, key, dataset.value);

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

function flatten_inheritance(input: CoreGroup, key: string, groups: Record<string, CoreGroup>): string[] | null {
	const output: string[] = [];

	if (!_flatten_inheritance(input, output, key, groups, 0))
		return null;

	return output;
}

function _flatten_inheritance(input: CoreGroup, output: string[], root: string, groups: Record<string, CoreGroup>, depth: number): boolean {
	if (depth > MAX_INHERITANCE_DEPTH)
		return false;

	for (const reference of input.inherits) {
		if (reference === root || output.includes(reference))
			continue;

		if (!Object.hasOwn(groups, reference))
			throw new Error("Bad group reference: " + reference);

		output.push(reference);

		const referenced_group = groups[reference]!;

		if (!_flatten_inheritance(referenced_group, output, root, groups, depth + 1))
			return false;
	}

	return true;
}
