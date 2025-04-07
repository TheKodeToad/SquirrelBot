import { util_config_schema } from "../../../schema/plugin/util.ts";
import { define_plugin } from "../../loader/plugin.ts";
import { ConfigCache } from "../core/public/config.ts";
import { invite_command } from "./command/invite.ts";
import { ping_command } from "./command/ping.ts";
import { snowflake_command } from "./command/snowflake.ts";

export const util_config = new ConfigCache(util_config_schema);

export const util_plugin = define_plugin({
	id: "util",
	config: util_config,
	commands: [ping_command, snowflake_command, invite_command],
});