import { define_plugin } from "../../types/plugin";
import { groups_command } from "./command/groups";
import { snowflake_command } from "./command/snowflake";

export const util_plugin = define_plugin({
	id: "util",
	commands: [snowflake_command, groups_command],
});