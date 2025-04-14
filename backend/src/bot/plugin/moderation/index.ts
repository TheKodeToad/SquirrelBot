import { moderationConfigSchema } from "../../../schema/plugin/moderation.ts";
import { definePlugin } from "../../loader/plugin.ts";
import { ConfigCache } from "../core/public/config.ts";
import { banCommand } from "./command/action/ban.ts";
import { kickCommand } from "./command/action/kick.ts";
import { muteCommand } from "./command/action/mute.ts";
import { unbanCommand } from "./command/action/unban.ts";
import { searchCasesCommand } from "./command/case/searchCases.ts";
import { showCaseCommand } from "./command/case/showCase.ts";
import { purgeCommand } from "./command/util/purge.ts";

export const moderationConfig = new ConfigCache(moderationConfigSchema);

export const moderationPlugin = definePlugin({
	id: "moderation",
	config: moderationConfig,
	commands: [banCommand, unbanCommand, kickCommand, muteCommand, showCaseCommand, searchCasesCommand, purgeCommand],
});
