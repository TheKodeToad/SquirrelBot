import { mappedEnum } from "#common/schemas/general.ts";
import { messageTemplate } from "#common/schemas/message.ts";
import { PermissionsFilter } from "#common/schemas/permissionsFilter.ts";
import { DAY } from "#common/time.ts";
import { DurationView } from "#common/views/duration.ts";
import { GuildView } from "#common/views/guild.ts";
import { UserView } from "#common/views/user.ts";
import { m } from "mousetache";
import { z } from "zod";

export const PresetReason = z.strictObject({
	name: z.string(),
	replacement: z.string(),
});
export interface PresetReason extends z.output<typeof PresetReason> {}

const discordReasons: PresetReason[] = [
	// TODO: treat these keys specially
	// "" will be replaced from language data
	{ name: "spam-acc", replacement: "" /* Suspicious or spam account */ },
	{ name: "hacked-acc", replacement: "" /* Compromised or hacked account */ },
	{ name: "rules", replacement: "" /* Breaking server rules */ },
];

const actionParams = m.object({
	moderator: UserView,
	server: GuildView,
	reason: m.terminal(),
});

export const enum MemberRanking {
	None,
	HighestRole,
	Level,
}

export const ModerationConfig = z.strictObject({
	presetReasons: PresetReason.array().default([]), // TODO
	presetPrefix: z.string().default("!"), // TODO

	memberRanking: mappedEnum({
		none: MemberRanking.None,
		highestRole: MemberRanking.HighestRole,
		level: MemberRanking.Level,
	})
		.default(MemberRanking.HighestRole)
		.describe(
			"Customize the system used to determine whether a moderator can moderate a user.\n"
				+ "'none' allows anyone to be moderated by a moderator.\n"
				+ "'highest_role' reflects the behavior of Discord; you can only moderate users who's highest role is below yours.\n"
				+ "'level' is based on who has a higher level in the app's group system.",
		),

	ban: z
		.strictObject({
			sendDirectMessage: z.boolean().default(false),
			directMessage: messageTemplate(actionParams).prefault({
				content:
					"You are banned from **{{server}}**{{#reason}}:\n>>> {{.}}{{/reason}}{{^reason}}!{{/reason}}",
			}),
			purgeMessages: z
				.number()
				.default(0)
				.transform((input) => input * DAY),
			presetReasons: PresetReason.array().default(discordReasons), // TODO
		})
		.prefault({})
		.describe("Configure ban behavior"),

	unban: z
		.strictObject({
			presetReasons: PresetReason.array().default([]),
		})
		.prefault({})
		.describe("Configure unban behavior"),

	kick: z
		.strictObject({
			sendDirectMessage: z.boolean().default(false),
			directMessage: messageTemplate(actionParams).prefault({
				content:
					"You were kicked in **{{server}}**{{#reason}}:\n>>> {{.}}{{/reason}}{{^reason}}!{{/reason}}",
			}),
			presetReasons: PresetReason.array().default(discordReasons), // TODO
		})
		.prefault({})
		.describe("Configure kick behavior"),

	timeout: z
		.strictObject({
			sendDirectMessage: z.boolean().default(false),
			directMessage: messageTemplate(
				m.object({
					...actionParams.entries,
					duration: DurationView,
				}),
			).prefault({
				content:
					"You were timed out in **{{server}}** for **{{duration}}**{{#reason}}:\n>>> {{.}}{{/reason}}{{^reason}}!{{/reason}}",
			}),
			presetReasons: PresetReason.array().default(discordReasons), // TODO
		})
		.prefault({})
		.describe("Configure timeout behavior"),

	removeTimeout: z
		.strictObject({
			sendDirectMessage: z.boolean().default(false),
			directMessage: messageTemplate(actionParams).prefault({
				content:
					"Your timeout was removed in **{{server}}**{{#reason}}:\n>>> {{.}}{{/reason}}{{^reason}}!{{/reason}}",
			}),
			presetReasons: PresetReason.array().default(discordReasons), // TODO
		})
		.prefault({})
		.describe("Configure timeout behavior"),

	warn: z
		.strictObject({
			sendDirectMessage: z.boolean().default(false),
			directMessage: messageTemplate(actionParams).prefault({
				content:
					"You were warned in {{server}}{{#reason}}:\n{{.}}{{/reason}}>>> {{^reason}}!{{/reason}}",
			}),
			presetReasons: PresetReason.array().default(discordReasons),
		})
		.prefault({})
		.describe("Configure warn behavior"),

	defaultPermissions: z
		.strictObject({
			ban: z.boolean().default(false),
			unban: z.boolean().default(false),
			kick: z.boolean().default(false),
			timeout: z.boolean().default(false),
			warn: z.boolean().default(false),
			purge: z.boolean().default(false),
			caseRead: z.boolean().default(false),
			caseDelete: z.boolean().default(false),
		})
		.prefault({}),
	permissionOverrides: z
		.strictObject({
			ban: z.boolean().optional(),
			unban: z.boolean().optional(),
			kick: z.boolean().optional(),
			warn: z.boolean().optional(),
			timeout: z.boolean().optional(),
			purge: z.boolean().optional(),
			caseRead: z.boolean().optional(),
			caseDelete: z.boolean().optional(),
			...PermissionsFilter.shape,
		})
		.array()
		.default([]),
});
export type ModerationConfig = z.output<typeof ModerationConfig>;
