import { messageTemplate } from "#common/schema/message.ts";
import { DurationView, makeDurationView } from "#common/template/duration.ts";
import { GuildView, makeGuildView } from "#common/template/guild.ts";
import {
	makeTimestampView,
	TimestampView,
} from "#common/template/timestamp.ts";
import {
	makeMemberUserView,
	makeUserView,
	UserView,
} from "#common/template/user.ts";
import { eventConfig } from "#plugin/logging/config/index.ts";
import type { ModEvent } from "#plugin/moderation/public/modEvent.ts";
import { m, type InferView } from "mousetache";
import { Member } from "oceanic.js";

export const ModEventView = m.object({
	guild: GuildView,

	performed_at: TimestampView,
	expires_at: TimestampView,
	duration: DurationView,

	moderator: UserView,
	target: UserView,

	reason: m.terminal({ noEscape: true }),

	purge_duration: DurationView,
	dm_delivered: m.terminal({ noEscape: true }),
	case_number: m.terminal({ noEscape: true }),
});
export type ModEventView = InferView<typeof ModEventView>;

export function makeModEventView(action: ModEvent): ModEventView {
	const result = {
		guild: makeGuildView(action.guild),

		performed_at: makeTimestampView(action.performedAt),
		expires_at:
			action.expiresAt !== undefined
				? makeTimestampView(action.expiresAt)
				: undefined,
		duration:
			action.expiresAt !== undefined
				? makeDurationView(
						action.expiresAt.getTime() -
							action.performedAt.getTime(),
					)
				: undefined,

		moderator: makeMemberUserView(action.actor),
		target:
			action.target instanceof Member
				? makeMemberUserView(action.target)
				: makeUserView(action.target),

		reason: action.reason,

		purge_duration:
			action.deleteMessageSeconds !== undefined &&
			action.deleteMessageSeconds !== 0
				? makeDurationView(action.deleteMessageSeconds * 1000)
				: undefined,
		dm_delivered: action.dmDelivered,
		case_number: action.caseNumber,
	};

	return result;
}

export const UserBanEvent = eventConfig(messageTemplate(ModEventView), {
	embeds: [
		{
			title: "User Banned {{#case_number}}(Case #{{.}}){{/case_number}}",
			color: "red",
			author: { name: "{{target}}", icon_url: "{{target.avatar}}" },
			fields: [
				{ name: "Reason", value: "{{reason}}" },
				{ name: "Moderator", value: "{{moderator.tag_mention}}" },
				{
					name: "Duration",
					value: "{{#duration}}{{.}} (expires at {{expires_at}}){{/duration}}",
				},
				{
					name: "Deleted Messages",
					value: "{{#purge_duration}}Last {{.}}{{/purge_duration}}",
				},
			],
			footer: { text: "Target ID: {{target.id}}" },
		},
	],
});

export const UserUnbanEvent = eventConfig(messageTemplate(ModEventView), {
	embeds: [
		{
			title: "Ban Revoked {{#case_number}}(Case #{{.}}){{/case_number}}",
			color: "green",
			author: { name: "{{target}}", icon_url: "{{target.avatar}}" },
			fields: [
				{ name: "Reason", value: "{{reason}}" },
				{ name: "Moderator", value: "{{moderator.tag_mention}}" },
			],
			footer: { text: "Target ID: {{target.id}}" },
		},
	],
});

export const UserKickEvent = eventConfig(messageTemplate(ModEventView), {
	embeds: [
		{
			title: "User Kicked {{#case_number}}(Case #{{.}}){{/case_number}}",
			color: "red",
			author: { name: "{{target}}", icon_url: "{{target.avatar}}" },
			fields: [
				{ name: "Reason", value: "{{reason}}" },
				{ name: "Moderator", value: "{{moderator.tag_mention}}" },
			],
			footer: { text: "Target ID: {{target.id}}" },
		},
	],
});

export const UserTimeoutEvent = eventConfig(messageTemplate(ModEventView), {
	embeds: [
		{
			title: "User Timed Out {{#case_number}}(Case #{{.}}){{/case_number}}",
			color: "fuchsia",
			author: { name: "{{target}}", icon_url: "{{target.avatar}}" },
			fields: [
				{ name: "Reason", value: "{{reason}}" },
				{ name: "Moderator", value: "{{moderator.tag_mention}}" },
				{
					name: "Duration",
					value: "{{#duration}}{{.}} (expires at {{expires_at}}){{/duration}}",
				},
			],
			footer: { text: "Target ID: {{target.id}}" },
		},
	],
});

export const UserWarnEvent = eventConfig(messageTemplate(ModEventView), {
	embeds: [
		{
			title: "Warned User {{#case_number}}(Case #{{.}}){{/case_number}}",
			color: "yellow",
			author: { name: "{{target}}", icon_url: "{{target.avatar}}" },
			fields: [
				{ name: "Reason", value: "{{reason}}" },
				{ name: "Moderator", value: "{{moderator.tag_mention}}" },
				{
					name: "Duration",
					value: "{{#duration}}{{.}} (expires at {{expires_at}}){{/duration}}",
				},
			],
			footer: { text: "Target ID: {{target.id}}" },
		},
	],
});
