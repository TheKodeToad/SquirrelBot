import { definePlugin } from "#bot/loader/plugin.ts";
import { ConfigStore } from "#bot/plugin/core/public/config.ts";
import { inviteInfoCommand } from "#bot/plugin/util/command/inviteInfo/index.ts";
import { pingCommand } from "#bot/plugin/util/command/ping.ts";
import { snowflakeCommand } from "#bot/plugin/util/command/snowflake.ts";
import { utilConfigSchema } from "#schema/plugin/util.ts";

export const utilConfig = new ConfigStore(utilConfigSchema);

const defaultConfig = `enabled = false

[default_permissions]
# Uncomment to give access to everyone:
# invite_info_command = true
# ping_command = true
# snowflake_command = true
`;

export const utilPlugin = definePlugin({
	id: "util",
	name: "Utilities",
	description: "Useful general purpose utilities.",

	config: { store: utilConfig, defaultValue: defaultConfig },
	commands: [inviteInfoCommand, pingCommand, snowflakeCommand]
});
