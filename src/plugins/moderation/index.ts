import { define_plugin } from "../../plugin/types";
import { ban_command } from "./ban";
import { kick_command } from "./kick";

export const moderation_plugin = define_plugin({
	id: "moderation",
	commands: [ban_command, kick_command],
});
