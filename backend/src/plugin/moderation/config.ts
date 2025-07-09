import { mappedEnum } from "#common/schema/general.ts";
import { messageTemplate } from "#common/schema/message.ts";
import { PermissionsFilter } from "#common/schema/permissionsFilter.ts";
import { ParameterType } from "#common/template/index.ts";
import { z } from "zod/v4";

export const PresetReason = z.strictObject({
	name: z.string(),
	replacement: z.string(),
});
export interface PresetReason extends z.output<typeof PresetReason> { }

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

export const enum MemberRanking {
	None,
	HighestRole,
	Level,
}

export const ModerationConfig = z.strictObject({
	preset_reasons: z.array(PresetReason).default([]), // TODO
	preset_prefix: z.string().default("!"), // TODO

	member_ranking: mappedEnum({
		none: MemberRanking.None,
		highest_role: MemberRanking.HighestRole,
		level: MemberRanking.Level
	}).default(MemberRanking.HighestRole).describe(
		"Customize the system used to determine whether a moderator can moderate a user.\n" +
		"'none' allows anyone to be moderated by a moderator.\n" +
		"'highest_role' reflects the behavior of Discord; you can only moderate users who's highest role is below yours.\n" +
		"'level' is based on who has a higher level in the app's group system."
	),

	ban: z.strictObject({
		send_direct_message: z.boolean().default(false),
		direct_message: messageTemplate(actionParams).optional(),
		purge_messages: z.number().default(0),
		preset_reasons: PresetReason.array().default(discordReasons) // TODO
	}).prefault({}).describe("Configure ban behavior"),

	unban: z.strictObject({
		preset_reasons: PresetReason.array().default([])
	}).prefault({}).describe("Configure unban behavior"),

	kick: z.strictObject({
		send_direct_message: z.boolean().default(false),
		direct_message: messageTemplate(actionParams).optional(),
		preset_reasons: PresetReason.array().default(discordReasons), // TODO
	}).prefault({}).describe("Configure kick behavior"),

	timeout: z.strictObject({
		send_direct_message: z.boolean().default(false),
		direct_message: messageTemplate({ ...actionParams, duration: ParameterType.Duration }).optional(),
		preset_reasons: PresetReason.array().default(discordReasons), // TODO
	}).prefault({}).describe("Configure timeout behavior"),

	warn: z.strictObject({
		send_direct_message: z.boolean().default(false),
		direct_message: messageTemplate(actionParams).optional(),
		preset_reasons: PresetReason.array().default(discordReasons),
	}).prefault({}).describe("Configure warn behavior"),

	default_permissions: z.strictObject({
		ban: z.boolean().default(false),
		unban: z.boolean().default(false),
		kick: z.boolean().default(false),
		timeout: z.boolean().default(false),
		warn: z.boolean().default(false),
		purge: z.boolean().default(false),
		case_read: z.boolean().default(false),
		case_delete: z.boolean().default(false),
	}).prefault({}),
	permission_overrides: z.strictObject({
		ban: z.boolean().optional(),
		unban: z.boolean().optional(),
		kick: z.boolean().optional(),
		warn: z.boolean().optional(),
		timeout: z.boolean().optional(),
		purge: z.boolean().optional(),
		case_read: z.boolean().optional(),
		case_delete: z.boolean().optional(),
		...PermissionsFilter.shape
	}).array().default([]),
});
export type ModerationConfig = z.output<typeof ModerationConfig>;
