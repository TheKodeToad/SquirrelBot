import { definePlugin } from "#plugin.ts";
import { ConfigStore } from "#plugin/core/public/configStore.ts";
import { defineConfig } from "#plugin/core/public/extensionPoints.ts";
import ban from "#plugin/moderation/command/action/ban.ts";
import kick from "#plugin/moderation/command/action/kick.ts";
import removeTimeout from "#plugin/moderation/command/action/removeTimeout.ts";
import timeout from "#plugin/moderation/command/action/timeout.ts";
import unban from "#plugin/moderation/command/action/unban.ts";
import warn from "#plugin/moderation/command/action/warn.ts";
import caseDelete from "#plugin/moderation/command/case/caseDelete.ts";
import caseList from "#plugin/moderation/command/case/caseList.ts";
import caseShow from "#plugin/moderation/command/case/caseShow.ts";
import purge from "#plugin/moderation/command/util/purge.ts";
import { ModerationConfig } from "#plugin/moderation/config.ts";
import casesRoutes from "#plugin/moderation/http/casesRoutes.ts";
import tempBanScheduler from "#plugin/moderation/tempBanScheduler.ts";

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
		...tempBanScheduler,

		ban, unban, kick, timeout, removeTimeout, warn, purge, caseShow, caseDelete, caseList,

		casesRoutes,
	]
});
