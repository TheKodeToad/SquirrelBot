import { ConfigStore } from "#plugin/core/public/config.ts";
import { definePlugin } from "#plugin/index.ts";
import { inviteInfoCommand } from "#plugin/util/command/inviteInfo/index.ts";
import { pingCommand } from "#plugin/util/command/ping.ts";
import { snowflakeCommand } from "#plugin/util/command/snowflake.ts";
import { UtilConfig } from "#schema/plugin/util.ts";

export const utilConfig = new ConfigStore(UtilConfig);

const defaultConfig = `enabled = false

[default_permissions]
# Uncomment to give access to everyone:
# invite_info_command = true
# ping_command = true
# snowflake_command = true
`;

export default definePlugin({
	id: "util",
	name: "Utilities",
	description: "Useful general purpose utilities.",

	config: { store: utilConfig, defaultValue: defaultConfig },
	commands: [inviteInfoCommand, pingCommand, snowflakeCommand]
});
