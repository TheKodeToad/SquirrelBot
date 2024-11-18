import { define_plugin } from "../../types/plugin";
import { groups_command } from "./command/groups";
import { ping_command } from "./command/ping";
import { snowflake_command } from "./command/snowflake";

export const util_plugin = define_plugin({
	id: "util",
	commands: [ping_command, snowflake_command, groups_command],
});