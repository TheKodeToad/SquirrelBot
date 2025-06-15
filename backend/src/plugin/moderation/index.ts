import { ConfigStore } from "#plugin/core/public/config.ts";
import { definePlugin } from "#plugin/index.ts";
import { banCommand } from "#plugin/moderation/command/action/ban.ts";
import { kickCommand } from "#plugin/moderation/command/action/kick.ts";
import { timeoutCommand } from "#plugin/moderation/command/action/timeout.ts";
import { unbanCommand } from "#plugin/moderation/command/action/unban.ts";
import { warnCommand } from "#plugin/moderation/command/action/warn.ts";
import { deleteCaseCommand } from "#plugin/moderation/command/case/caseDelete.ts";
import { caseListCommand } from "#plugin/moderation/command/case/caseList.ts";
import { caseShowCommand } from "#plugin/moderation/command/case/caseShow.ts";
import { purgeCommand } from "#plugin/moderation/command/util/purge.ts";
import { ModerationConfig } from "#schema/plugin/moderation.ts";

export const moderationConfig = new ConfigStore(ModerationConfig);

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

export default definePlugin({
	id: "moderation",
	name: "Moderation",
	description: "Perform and record moderation actions.",

	config: { store: moderationConfig, defaultValue: defaultConfig },
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
