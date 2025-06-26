import { messageTemplate } from "#common/schema/message.ts";
import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import { ParameterType } from "#common/template/index.ts";
import { array, boolean, description, type InferOutput, number, object, optional, pipe, string } from "valibot";

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

	ban: pipe(
		optional(object({
			send_direct_message: optional(boolean(), false),
			direct_message: optional(messageTemplate(actionParams)),
			purge_messages: optional(number(), 0),
			preset_reasons: optional(array(PresetReason), discordReasons) // TODO
		}), {}),
		description("Configure ban behavior")
	),
	unban: pipe(
		optional(object({
			preset_reasons: optional(array(PresetReason), [])
		}), {}),
		description("Configure unban behavior")
	),
	kick: pipe(
		optional(object({
			send_direct_message: optional(boolean(), false),
			direct_message: optional(messageTemplate(actionParams)),
			preset_reasons: optional(array(PresetReason), discordReasons), // TODO
		}), {}),
		description("Configure kick behavior")
	),
	timeout: pipe(
		optional(object({
			send_direct_message: optional(boolean(), false),
			direct_message: optional(messageTemplate({ ...actionParams, duration: ParameterType.Duration })),
			preset_reasons: optional(array(PresetReason), discordReasons), // TODO
		}), {}),
		description("Configure timeout behavior")
	),
	warn: pipe(
		optional(object({
			send_direct_message: optional(boolean(), false),
			direct_message: optional(messageTemplate(actionParams)),
			preset_reasons: optional(array(PresetReason), discordReasons),
		}), {}),
		description("Configure warn behavior")
	),

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
