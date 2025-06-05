import { ParameterType } from "#common/template/index.ts";
import { messageTemplate } from "#schema/common/message.ts";
import { PermissionsFilter } from "#schema/common/permissionsFilter.ts";
import { array, boolean, type InferOutput, number, object, optional, string } from "valibot";

export const PresetReason = object({
	name: string(),
	replacement: string(),
});
export interface PresetReason extends InferOutput<typeof PresetReason> { }

const discordReasons: PresetReason[] = [
	// TODO: treat these keys specially
	// "" will be replaced from language data
	{ name: "spam-acc", replacement: "" /* Suspicious or spam account */ },
	{ name: "hacked-acc", replacement: "" /* Compromised or hacked account */ },
	{ name: "rules", replacement: "" /* Breaking server rules */ },
];

const actionParams = {
	moderator: ParameterType.User,
	server: ParameterType.Guild,
	reason: ParameterType.MarkdownString,
} as const;

export const ModerationConfig = object({
	preset_reasons: optional(array(PresetReason), []), // TODO
	preset_prefix: optional(string(), "!"), // TODO

	ban: optional(object({
		send_direct_message: optional(boolean(), false),
		direct_message: optional(messageTemplate(actionParams)),
		purge_messages: optional(number(), 0),
		preset_reasons: optional(array(PresetReason), discordReasons) // TODO
	}), {}),
	unban: optional(object({
		preset_reasons: optional(array(PresetReason), [])
	}), {}),
	kick: optional(object({
		send_direct_message: optional(boolean(), false),
		direct_message: optional(messageTemplate(actionParams)),
		preset_reasons: optional(array(PresetReason), discordReasons), // TODO
	}), {}),
	timeout: optional(object({
		send_direct_message: optional(boolean(), false),
		direct_message: optional(messageTemplate({ ...actionParams, duration: ParameterType.Duration })),
		preset_reasons: optional(array(PresetReason), discordReasons), // TODO
	}), {}),
	warn: optional(object({
		send_direct_message: optional(boolean(), false),
		direct_message: optional(messageTemplate(actionParams)),
		preset_reasons: optional(array(PresetReason), discordReasons),
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
		...PermissionsFilter.entries
	})), []),
});
export type ModerationConfig = InferOutput<typeof ModerationConfig>;
