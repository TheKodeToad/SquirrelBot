import { definePlugin } from "#bot/loader/plugin.ts";
import { ConfigStore } from "#bot/plugin/core/public/config.ts";
import { banCommand } from "#bot/plugin/moderation/command/action/ban.ts";
import { kickCommand } from "#bot/plugin/moderation/command/action/kick.ts";
import { timeoutCommand } from "#bot/plugin/moderation/command/action/timeout.ts";
import { unbanCommand } from "#bot/plugin/moderation/command/action/unban.ts";
import { warnCommand } from "#bot/plugin/moderation/command/action/warn.ts";
import { deleteCaseCommand } from "#bot/plugin/moderation/command/case/caseDelete.ts";
import { caseListCommand } from "#bot/plugin/moderation/command/case/caseList.ts";
import { caseShowCommand } from "#bot/plugin/moderation/command/case/caseShow.ts";
import { purgeCommand } from "#bot/plugin/moderation/command/util/purge.ts";
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

export const moderationPlugin = definePlugin({
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
