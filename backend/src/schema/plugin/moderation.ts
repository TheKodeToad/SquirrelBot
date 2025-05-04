import { array, boolean, type InferOutput, number, object, optional, string } from "valibot";
import { messageSchema } from "../common/message.ts";
import { permissionsFilterSchema } from "../common/permissionsFilter.ts";

export const presetReasonSchema = object({
	name: string(),
	replacement: string(),
});
export interface PresetReason extends InferOutput<typeof presetReasonSchema> { }

const discordReasons: PresetReason[] = [
	// TODO: treat these keys specially
	// "" will be replaced from language data
	{ name: "spam-acc", replacement: "" /* Suspicious or spam account */ },
	{ name: "hacked-acc", replacement: "" /* Compromised or hacked account */ },
	{ name: "rules", replacement: "" /* Breaking server rules */ },
];

export const moderationConfigSchema = object({
	preset_reasons: optional(array(presetReasonSchema), []), // TODO
	preset_prefix: optional(string(), "!"), // TODO

	ban: optional(object({
		send_direct_message: optional(boolean(), false),
		direct_message: optional(messageSchema),
		purge_messages: optional(number(), 0),
		preset_reasons: optional(array(presetReasonSchema), discordReasons) // TODO
	}), {}),
	unban: optional(object({
		preset_reasons: optional(array(presetReasonSchema), [])
	}), {}),
	kick: optional(object({
		send_direct_message: optional(boolean(), false),
		direct_message: optional(messageSchema),
		preset_reasons: optional(array(presetReasonSchema), discordReasons), // TODO
	}), {}),
	timeout: optional(object({
		send_direct_message: optional(boolean(), false),
		direct_message: optional(messageSchema),
		preset_reasons: optional(array(presetReasonSchema), discordReasons), // TODO
	}), {}),
	warn: optional(object({
		send_direct_message: optional(boolean(), false),
		direct_message: optional(messageSchema),
		preset_reasons: optional(array(presetReasonSchema), discordReasons),
	}), {}),

	default_permissions: optional(object({
		ban: optional(boolean(), false),
		unban: optional(boolean(), false),
		kick: optional(boolean(), false),
		timeout: optional(boolean(), false),
		warn: optional(boolean(), false),
		purge: optional(boolean(), false),
		case_read: optional(boolean(), false),
		case_delete: optional(boolean(), false),
	}), {}),
	permission_overrides: optional(array(object({
		ban: optional(boolean()),
		unban: optional(boolean()),
		kick: optional(boolean()),
		warn: optional(boolean()),
		timeout: optional(boolean()),
		purge: optional(boolean()),
		case_read: optional(boolean()),
		case_delete: optional(boolean()),
		...permissionsFilterSchema.entries
	})), []),
});
export interface ModerationConfig extends InferOutput<typeof moderationConfigSchema> { }
