import { messageTemplate } from "#common/schemas/message.ts";
import { eventConfig } from "#plugins/logging/config.ts";
import { ModEventView } from "#plugins/logging/loggers/modEvents/views.ts";

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
