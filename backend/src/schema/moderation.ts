import { array, boolean, type InferOutput, number, object, optional, string } from "valibot";
import { permissions_filter_schema } from "./common/permissions_filter.ts";

export const preset_reason_schema = object({
	name: string(),
	replacement: string(),
});
export interface PresetReason extends InferOutput<typeof preset_reason_schema> { }

const discord_reasons: PresetReason[] = [
	// TODO: treat these keys specially
	// "" will be replaced from language data
	{ name: "spam-acc", replacement: "" /* Suspicious or spam account */ },
	{ name: "hacked-acc", replacement: "" /* Compromised or hacked account */ },
	{ name: "rules", replacement: "" /* Breaking server rules */ },
];

export const moderation_config_schema = object({
	preset_reasons: optional(array(preset_reason_schema), []), // TODO
	preset_prefix: optional(string(), "!"), // TODO

	ban: optional(object({
		send_direct_message: optional(boolean(), false),
		direct_message: optional(string()),
		purge_messages: optional(number(), 0),
		preset_reasons: optional(array(preset_reason_schema), discord_reasons) // TODO
	}), {}),
	unban: optional(object({
		preset_reasons: optional(array(preset_reason_schema), [])
	}), {}),
	kick: optional(object({
		send_direct_message: optional(boolean(), false),
		direct_message: optional(string()),
		preset_reasons: optional(array(preset_reason_schema), discord_reasons), // TODO
	}), {}),

	default_permissions: optional(object({
		ban: optional(boolean(), false),
		unban: optional(boolean(), false),
		kick: optional(boolean(), false),
		purge: optional(boolean(), false),
		case_read: optional(boolean(), false),
	}), {}),
	permission_overrides: optional(array(object({
		ban: optional(boolean()),
		unban: optional(boolean()),
		kick: optional(boolean()),
		purge: optional(boolean()),
		case_read: optional(boolean()),
		...permissions_filter_schema.entries
	})), []),
});
export interface ModerationConfig extends InferOutput<typeof moderation_config_schema> { }
