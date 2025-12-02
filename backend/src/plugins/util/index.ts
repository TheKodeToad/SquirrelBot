import { definePlugin } from "#plugin.ts";
import { ConfigStore } from "#plugins/core/public/configStore.ts";
import { defineConfig } from "#plugins/core/public/extensionPoints.ts";
import inviteInfo from "#plugins/util/command/inviteInfo/index.ts";
import ping from "#plugins/util/command/ping.ts";
import snowflake from "#plugins/util/command/snowflake.ts";
import { UtilConfig } from "#plugins/util/config.ts";

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

		inviteInfo,
		ping,
		snowflake,
	],
});
