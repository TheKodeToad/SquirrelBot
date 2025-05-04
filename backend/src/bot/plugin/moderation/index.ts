import { moderationConfigSchema } from "../../../schema/plugin/moderation.ts";
import { definePlugin } from "../../loader/plugin.ts";
import { ConfigStore } from "../core/public/config.ts";
import { banCommand } from "./command/action/ban.ts";
import { kickCommand } from "./command/action/kick.ts";
import { timeoutCommand } from "./command/action/timeout.ts";
import { unbanCommand } from "./command/action/unban.ts";
import { warnCommand } from "./command/action/warn.ts";
import { deleteCaseCommand } from "./command/case/caseDelete.ts";
import { caseListCommand } from "./command/case/caseList.ts";
import { caseShowCommand } from "./command/case/caseShow.ts";
import { purgeCommand } from "./command/util/purge.ts";

const defaultConfig = `enabled = false

# Example: Allow users in the moderator group to delete reminders of other users
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

export const moderationConfig = new ConfigStore(moderationConfigSchema, defaultConfig);

export const moderationPlugin = definePlugin({
	id: "moderation",
	name: "Moderation",
	description: "Perform and record moderation actions.",

	config: moderationConfig,
	commands: [
		banCommand,
		unbanCommand,
		kickCommand,
		timeoutCommand,
		warnCommand,
		purgeCommand,
		caseShowCommand,
		deleteCaseCommand,
		caseListCommand,
	],
});
