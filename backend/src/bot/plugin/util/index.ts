import { define_plugin } from "../../loader/plugin.ts";
import { invite_command } from "./command/invite.ts";
import { ping_command } from "./command/ping.ts";
import { snowflake_command } from "./command/snowflake.ts";

export const util_plugin = define_plugin({
	id: "util",
	commands: [ping_command, snowflake_command, invite_command],
});