import { definePlugin } from "#loader/plugin.ts";
import { ConfigStore } from "#plugin/core/discord/public/configStore.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import { ModerationConfig } from "#plugin/moderation/config.ts";
import ban from "#plugin/moderation/discord/command/action/ban.ts";
import kick from "#plugin/moderation/discord/command/action/kick.ts";
import timeout from "#plugin/moderation/discord/command/action/timeout.ts";
import unban from "#plugin/moderation/discord/command/action/unban.ts";
import warn from "#plugin/moderation/discord/command/action/warn.ts";
import caseDelete from "#plugin/moderation/discord/command/case/caseDelete.ts";
import caseList from "#plugin/moderation/discord/command/case/caseList.ts";
import caseShow from "#plugin/moderation/discord/command/case/caseShow.ts";
import purge from "#plugin/moderation/discord/command/util/purge.ts";
import casesRoutes from "#plugin/moderation/http/casesRoutes.ts";

export const moderationConfigStore = new ConfigStore(ModerationConfig);

const defaultConfig = `enabled = false

# Example: Add moderation perms to user in the moderator group
# [[permission_overrides]]
# in_group = ["moderator"]
# ban = true
# unban = true
# kick = true
# mute = true
# warn = true
# purge = true
# case_read = true
# case_delete = true
`;

export default definePlugin({
	id: "moderation",
	name: "Moderation",
	description: "Perform and record moderation actions.",

	contributions: [
		defineConfig({
			store: moderationConfigStore,
			defaultValue: defaultConfig,
		}),

		ban, unban, kick, timeout, warn, purge, caseShow, caseDelete, caseList,

		casesRoutes,
	]
});
