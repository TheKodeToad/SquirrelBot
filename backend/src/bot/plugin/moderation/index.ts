import { moderationConfigSchema } from "../../../schema/plugin/moderation.ts";
import { definePlugin } from "../../loader/plugin.ts";
import { ConfigCache } from "../core/public/config.ts";
import { banCommand } from "./command/action/ban.ts";
import { kickCommand } from "./command/action/kick.ts";
import { muteCommand } from "./command/action/mute.ts";
import { unbanCommand } from "./command/action/unban.ts";
import { warnCommand } from "./command/action/warn.ts";
import { deleteCaseCommand } from "./command/case/caseDelete.ts";
import { caseListCommand } from "./command/case/caseList.ts";
import { caseShowCommand } from "./command/case/caseShow.ts";
import { purgeCommand } from "./command/util/purge.ts";

export const moderationConfig = new ConfigCache(moderationConfigSchema);

export const moderationPlugin = definePlugin({
	id: "moderation",
	config: moderationConfig,
	commands: [
		banCommand,
		unbanCommand,
		kickCommand,
		muteCommand,
		warnCommand,
		purgeCommand,
		caseShowCommand,
		deleteCaseCommand,
		caseListCommand,
	],
});
