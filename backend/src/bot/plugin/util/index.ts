import { utilConfigSchema } from "../../../schema/plugin/util.ts";
import { definePlugin } from "../../loader/plugin.ts";
import { ConfigStore } from "../core/public/config.ts";
import { inviteInfoCommand } from "./command/inviteInfo/index.ts";
import { pingCommand } from "./command/ping.ts";
import { snowflakeCommand } from "./command/snowflake.ts";

const defaultConfig = `enabled = false

[default_permissions]
# Uncomment to give access to everyone:
# invite_info_command = true
# ping_command = true
# snowflake_command = true
`;

export const utilConfig = new ConfigStore(utilConfigSchema, defaultConfig);

export const utilPlugin = definePlugin({
	id: "util",
	name: "Utilities",
	description: "Useful general purpose utilities.",

	config: utilConfig,
	commands: [inviteInfoCommand, pingCommand, snowflakeCommand],
});;
