import { ComponentTypes, type MessageActionRow } from "oceanic.js";
import type { Command, Reply } from "../public/command.ts";

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

export function default_id(id: Command["id"]): string {
	if (Array.isArray(id))
		return id[0];
	else
		return id;
}

export function transform_reply(reply: Reply) {
	if (typeof reply === "string")
		reply = { content: reply };

	return {
		attachments: [],
		content: "",
		embeds: [],
		files: [],
		...reply,
		components: reply.components?.map(components => ({ type: ComponentTypes.ACTION_ROW, components } as MessageActionRow)) ?? []
	};
}