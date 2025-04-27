import { object } from "valibot";
import { snowflakeSchema } from "../common/index.ts";

export const loggingConfigSchema = object({
	channel: snowflakeSchema,
});
