import { define_plugin } from "../../plugin/types";
import { ban_command } from "./ban";

export const moderation_plugin = define_plugin({
	id: "moderation",
	commands: [ban_command],
	apply(client) {

	},
});