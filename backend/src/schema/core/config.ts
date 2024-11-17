import { InferOutput, array, number, object, optional, pipe, rawCheck, record, regex, string } from "valibot";
import { SNOWFLAKE_REGEX } from "../../common/snowflake";

export const core_group_schema = object({
	users: optional(array(pipe(string(), regex(SNOWFLAKE_REGEX, "invalid user ID"))), []),
	roles: optional(array(pipe(string(), regex(SNOWFLAKE_REGEX, "invalid role ID"))), []),
	channels: optional(array(pipe(string(), regex(SNOWFLAKE_REGEX, "invalid channel ID"))), []),
	threads: optional(array(pipe(string(), regex(SNOWFLAKE_REGEX, "invalid thread ID"))), []),
	channel_categories: optional(array(pipe(string(), regex(SNOWFLAKE_REGEX, "invalid channel category ID"))), []),
	inherits: optional(array(string()), []),
	level: optional(number())
});
export type CoreGroup = InferOutput<typeof core_group_schema>;

export const core_config_schema = object({
	groups: optional(pipe(record(
		string(),
		core_group_schema
	), rawCheck(({ dataset, addIssue }) => {
		if (!dataset.typed)
			return;

		for (const key in dataset.value) {
			if (!Object.hasOwn(dataset.value, key))
				continue;

			const value = dataset.value[key]!;

			value.inherits?.forEach((group, index) => {
				if (Object.hasOwn(dataset.value, group))
					return;

				addIssue({
					message: `${group} does not name a group`,
					path: [
						{ type: "object", origin: "value", input: dataset.value, key, value },
						{ type: "object", origin: "value", input: value, key: "inherits", value: value.inherits },
						{ type: "array", origin: "value", input: value.inherits!, key: index, value: group }
					]
				});
			});
		}
	})), {}),

	prefix: optional(string(), "?"),

	// permissions: optional(array(object({
	// 	prefix_commands: optional(boolean()),
	// 	slash_commands: optional(boolean()),
	// 	...permissions_filter_schema.entries,
	// })), []),
});
export type CoreConfig = InferOutput<typeof core_config_schema>;
