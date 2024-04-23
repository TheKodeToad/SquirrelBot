import { define_plugin } from "../../plugin";
import { ban_command } from "./command/ban";
import { case_command } from "./command/case";
import { cases_command } from "./command/cases";
import { kick_command } from "./command/kick";

export const moderation_plugin = define_plugin({
	id: "moderation",
	commands: [ban_command, kick_command, case_command, cases_command],
});
