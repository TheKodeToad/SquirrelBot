import { messageTemplate } from "#common/schemas/message.ts";
import { eventConfig } from "#plugins/logging/config.ts";
import {
	RoleCreateView,
	RoleDeleteView,
	RoleUpdateView,
} from "#plugins/logging/loggers/roles/views.ts";

export const RoleCreateEvent = eventConfig(messageTemplate(RoleCreateView), {
	embeds: [
		{
			title: "Role Created",
			author: { name: "{{actor.tag}}", iconURL: "{{actor.avatar}}" },
			description: "{{role.mention}}",
			fields: [
				{ name: "Name", value: "{{role.name}}" },
				{ name: "Color", value: "{{role.color}}" },
				{ name: "Hoisted", value: "{{role.hoisted}}" },
				{ name: "Mentionable", value: "{{role.mentionable}}" },
			],
			color: "green",
			footer: { text: "Actor ID: {{actor.id}}" },
		},
	],
});

export const RoleUpdateEvent = eventConfig(messageTemplate(RoleUpdateView), {
	embeds: [
		{
			title: "Updated Role",
			author: { name: "{{actor.tag}}", iconURL: "{{actor.avatar}}" },
			description: "{{newRole.mention}}",
			fields: [
				{
					name: "Name",
					value: "{{#nameChanged}}{{oldRole.name}} → {{newRole.name}}{{/nameChanged}}",
				},
				{
					name: "Color",
					value: "{{#colorChanged}}{{oldRole.color}} → {{newRole.color}}{{/colorChanged}}",
				},
				{
					name: "Hoisted",
					value: "{{#hoistedChanged}}{{oldRole.hoisted}} → {{newRole.hoisted}}{{/hoistedChanged}}",
				},
				{
					name: "Mentionable",
					value: "{{#mentionableChanged}}{{oldRole.mentionable}} → {{newRole.mentionable}}{{/mentionableChanged}}",
				},
			],
			color: "yellow",
			footer: { text: "Actor ID: {{actor.id}}" },
		},
	],
});

export const RoleDeleteEvent = eventConfig(messageTemplate(RoleDeleteView), {
	embeds: [
		{
			title: "Deleted Role",
			author: { name: "{{actor.tag}}", iconURL: "{{actor.avatar}}" },
			fields: [
				{ name: "Name", value: "{{role.name}}" },
				{ name: "Color", value: "{{role.color}}" },
				{ name: "Hoisted", value: "{{role.hoisted}}" },
				{ name: "Mentionable", value: "{{role.mentionable}}" },
			],
			color: "red",
			footer: { text: "Actor ID: {{actor.id}}" },
		},
	],
});
