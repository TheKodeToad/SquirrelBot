import { define_plugin } from "../../plugin/types";
import { ban_command } from "./command/ban";
import { case_command } from "./command/case";
import { kick_command } from "./command/kick";

export const moderation_plugin = define_plugin({
	id: "moderation",
	commands: [ban_command, kick_command, case_command],
});
