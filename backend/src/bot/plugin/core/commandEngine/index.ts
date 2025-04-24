import { ComponentTypes, MessageFlags } from "oceanic.js";
import type { Reply } from "../public/command.ts";

/**
 * How long to expire command state (edit tracking + component listening)
 */
export const STATE_EXPIRE_AFTER = 1000 * 60 * 30;
export const STATE_CLEANUP_INTERVAL = 1000 * 60;
/**
 * Interactions are deferred if the command is taking some time to finish rather than relying on the author of the command to remember to defer it manually
 * (this should also improve latency - in the best case only one api call is being sent back to Discord)
 */
export const AUTO_DEFER_AFTER = 1000;

export function transformReply(reply: Reply) {
	if (typeof reply === "string") {
		reply = {
			components: [{
				type: ComponentTypes.TEXT_DISPLAY,
				content: reply
			}],
		};
	}

	reply.flags ??= 0;
	reply.flags |= MessageFlags.IS_COMPONENTS_V2;

	return reply;
}

