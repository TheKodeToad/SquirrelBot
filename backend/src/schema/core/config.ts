import { InferOutput, array, boolean, object, optional, parse, pipe, rawCheck, record, regex, string } from "valibot";
import { SNOWFLAKE_REGEX } from "../../common/snowflake";

export const core_config_schema = object({
	groups: optional(pipe(record(
		string(),
		object({
			users: optional(array(pipe(string(), regex(SNOWFLAKE_REGEX, "invalid user ID")))),
			roles: optional(array(pipe(string(), regex(SNOWFLAKE_REGEX, "invalid role ID")))),
			inherits: optional(array(string()))
		})
	), rawCheck(({ dataset, addIssue }) => {
		if (!dataset.typed)
			return;

		for (const key in dataset.value) {
			if (!Object.hasOwn(dataset.value, key))
				continue;

			const value = dataset.value[key]!;

			value.inherits?.forEach((group, index) => {
				if (!Object.hasOwn(dataset.value, group)) {
					addIssue({
						message: `${group} does not name a group`,
						path: [
							{
								type: "object",
								origin: "value",
								input: dataset.value,
								key,
								value
							},
							{
								type: "object",
								origin: "value",
								input: value,
								key: "inherits",
								value: value.inherits
							},
							{
								type: "array",
								origin: "value",
								input: value.inherits!,
								key: index,
								value: group
							}
						]
					});
				}
			});
		}
	})), {}),

	prefix_commands: optional(object({
		enabled: optional(boolean(), true),
		prefix: optional(string(), "?")
	}), {}),

	slash_commands: optional(object({
		enabled: optional(boolean(), true)
	}), {})
});
export type CoreConfig = InferOutput<typeof core_config_schema>;
export const default_core_config = parse(core_config_schema, {});
