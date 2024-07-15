import { define_plugin } from "../../types/plugin";
import { snowflake_command } from "./command/snowflake";

export const util_plugin = define_plugin({
	id: "util",
	commands: [snowflake_command],
});