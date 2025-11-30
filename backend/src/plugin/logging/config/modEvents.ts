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

	performedAt: TimestampView,
	expiresAt: TimestampView,
	duration: DurationView,

	moderator: UserView,
	target: UserView,

	reason: m.terminal({ noEscape: true }),

	purgeDuration: DurationView,
	dmDelivered: m.terminal({ noEscape: true }),
	caseNumber: m.terminal({ noEscape: true }),
});
export type ModEventView = InferView<typeof ModEventView>;

export function makeModEventView(action: ModEvent): ModEventView {
	const result = {
		guild: makeGuildView(action.guild),

		performedAt: makeTimestampView(action.performedAt),
		expiresAt:
			action.expiresAt !== undefined ?
				makeTimestampView(action.expiresAt)
			:	undefined,
		duration:
			action.expiresAt !== undefined ?
				makeDurationView(
					action.expiresAt.getTime() - action.performedAt.getTime(),
				)
			:	undefined,

		moderator: makeMemberUserView(action.actor),
		target:
			action.target instanceof Member ?
				makeMemberUserView(action.target)
			:	makeUserView(action.target),

		reason: action.reason,

		purgeDuration:
			(
				action.deleteMessageSeconds !== undefined &&
				action.deleteMessageSeconds !== 0
			) ?
				makeDurationView(action.deleteMessageSeconds * 1000)
			:	undefined,
		dmDelivered: action.dmDelivered,
		caseNumber: action.caseNumber,
	};

	return result;
}

export const UserBanEvent = eventConfig(messageTemplate(ModEventView), {
	embeds: [
		{
			title: "User Banned {{#caseNumber}}(Case #{{.}}){{/caseNumber}}",
			color: "red",
			author: { name: "{{target}}", iconURL: "{{target.avatar}}" },
			fields: [
				{ name: "Reason", value: "{{reason}}" },
				{ name: "Moderator", value: "{{moderator.tagMention}}" },
				{
					name: "Duration",
					value: "{{#duration}}{{.}} (expires at {{expiresAt}}){{/duration}}",
				},
				{
					name: "Deleted Messages",
					value: "{{#purgeDuration}}Last {{.}}{{/purgeDuration}}",
				},
			],
			footer: { text: "Target ID: {{target.id}}" },
		},
	],
});

export const UserUnbanEvent = eventConfig(messageTemplate(ModEventView), {
	embeds: [
		{
			title: "Ban Revoked {{#caseNumber}}(Case #{{.}}){{/caseNumber}}",
			color: "green",
			author: { name: "{{target}}", iconURL: "{{target.avatar}}" },
			fields: [
				{ name: "Reason", value: "{{reason}}" },
				{ name: "Moderator", value: "{{moderator.tagMention}}" },
			],
			footer: { text: "Target ID: {{target.id}}" },
		},
	],
});

export const UserKickEvent = eventConfig(messageTemplate(ModEventView), {
	embeds: [
		{
			title: "User Kicked {{#caseNumber}}(Case #{{.}}){{/caseNumber}}",
			color: "red",
			author: { name: "{{target}}", iconURL: "{{target.avatar}}" },
			fields: [
				{ name: "Reason", value: "{{reason}}" },
				{ name: "Moderator", value: "{{moderator.tagMention}}" },
			],
			footer: { text: "Target ID: {{target.id}}" },
		},
	],
});

export const UserTimeoutEvent = eventConfig(messageTemplate(ModEventView), {
	embeds: [
		{
			title: "User Timed Out {{#caseNumber}}(Case #{{.}}){{/caseNumber}}",
			color: "fuchsia",
			author: { name: "{{target}}", iconURL: "{{target.avatar}}" },
			fields: [
				{ name: "Reason", value: "{{reason}}" },
				{ name: "Moderator", value: "{{moderator.tagMention}}" },
				{
					name: "Duration",
					value: "{{#duration}}{{.}} (expires at {{expiresAt}}){{/duration}}",
				},
			],
			footer: { text: "Target ID: {{target.id}}" },
		},
	],
});

export const UserWarnEvent = eventConfig(messageTemplate(ModEventView), {
	embeds: [
		{
			title: "Warned User {{#caseNumber}}(Case #{{.}}){{/caseNumber}}",
			color: "yellow",
			author: { name: "{{target}}", iconURL: "{{target.avatar}}" },
			fields: [
				{ name: "Reason", value: "{{reason}}" },
				{ name: "Moderator", value: "{{moderator.tagMention}}" },
				{
					name: "Duration",
					value: "{{#duration}}{{.}} (expires at {{expiresAt}}){{/duration}}",
				},
			],
			footer: { text: "Target ID: {{target.id}}" },
		},
	],
});
