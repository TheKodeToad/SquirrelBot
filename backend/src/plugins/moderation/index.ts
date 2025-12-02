import { definePlugin } from "#plugin.ts";
import { ConfigStore } from "#plugins/core/public/configStore.ts";
import { defineConfig } from "#plugins/core/public/extensionPoints.ts";
import ban from "#plugins/moderation/command/action/ban.ts";
import kick from "#plugins/moderation/command/action/kick.ts";
import removeTimeout from "#plugins/moderation/command/action/removeTimeout.ts";
import timeout from "#plugins/moderation/command/action/timeout.ts";
import unban from "#plugins/moderation/command/action/unban.ts";
import warn from "#plugins/moderation/command/action/warn.ts";
import caseDelete from "#plugins/moderation/command/case/caseDelete.ts";
import caseList from "#plugins/moderation/command/case/caseList.ts";
import caseShow from "#plugins/moderation/command/case/caseShow.ts";
import purge from "#plugins/moderation/command/util/purge.ts";
import { ModerationConfig } from "#plugins/moderation/config.ts";
import casesRoutes from "#plugins/moderation/http/casesRoutes.ts";
import tempBanScheduler from "#plugins/moderation/tempBanScheduler.ts";

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

		ban,
		unban,
		kick,
		timeout,
		removeTimeout,
		warn,
		purge,
		caseShow,
		caseDelete,
		caseList,

		casesRoutes,
	],
});
