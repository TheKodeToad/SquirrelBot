import { define_plugin } from "../../core/types/plugin";
import { ban_command } from "./command/ban";
import { case_command } from "./command/case";
import { cases_command } from "./command/cases";
import { kick_command } from "./command/kick";
import { purge_command } from "./command/purge";
import { unban_command } from "./command/unban";

export const moderation_plugin = define_plugin({
	id: "moderation",
	commands: [ban_command, unban_command, kick_command, case_command, cases_command, purge_command],
});
