import { utilConfigSchema } from "../../../schema/plugin/util.ts";
import { definePlugin } from "../../loader/plugin.ts";
import { ConfigCache } from "../core/public/config.ts";
import { inviteCommand } from "./command/invite.ts";
import { pingCommand } from "./command/ping.ts";
import { snowflakeCommand } from "./command/snowflake.ts";

export const utilConfig = new ConfigCache(utilConfigSchema);

export const utilPlugin = definePlugin({
	id: "util",
	config: utilConfig,
	commands: [pingCommand, snowflakeCommand, inviteCommand],
});