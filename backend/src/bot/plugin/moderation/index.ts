import { moderationConfigSchema } from "../../../schema/plugin/moderation.ts";
import { definePlugin } from "../../loader/plugin.ts";
import { ConfigCache } from "../core/public/config.ts";
import { banCommand } from "./command/ban.ts";
import { caseCommand } from "./command/case.ts";
import { casesCommand } from "./command/cases.ts";
import { kickCommand } from "./command/kick.ts";
import { purgeCommand } from "./command/purge.ts";
import { unbanCommand } from "./command/unban.ts";

export const moderationConfig = new ConfigCache(moderationConfigSchema);

export const moderationPlugin = definePlugin({
	id: "moderation",
	config: moderationConfig,
	commands: [banCommand, unbanCommand, kickCommand, caseCommand, casesCommand, purgeCommand],
});
