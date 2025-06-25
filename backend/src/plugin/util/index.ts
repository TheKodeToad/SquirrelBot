import { definePlugin } from "#loader/plugin.ts";
import { ConfigStore } from "#plugin/core/public/discord/configStore.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import { UtilConfig } from "#plugin/util/config.ts";
import inviteInfo from "#plugin/util/discord/command/inviteInfo/index.ts";
import ping from "#plugin/util/discord/command/ping.ts";
import snowflake from "#plugin/util/discord/command/snowflake.ts";

export const utilConfigStore = new ConfigStore(UtilConfig);

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

	contributions: [
		defineConfig({
			store: utilConfigStore,
			defaultValue: defaultConfig,
		}),

		inviteInfo, ping, snowflake,
	]
});
