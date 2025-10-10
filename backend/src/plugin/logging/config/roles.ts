import { messageTemplate } from "#common/schema/message.ts";
import { RoleView } from "#common/template/role.ts";
import { UserView } from "#common/template/user.ts";
import { eventConfig } from "#plugin/logging/config/index.ts";
import { m } from "mousetache";

export const roleCreateEvent = eventConfig(
	messageTemplate(m.object({
		actor: UserView,
		role: RoleView,
	})),
	{
		embeds: [{
			title: "Role Created",
			author: { name: "{{actor.tag}}", icon_url: "{{actor.avatar}}" },
			description: "{{role.mention}}",
			fields: [
				{ name: "Name", value: "{{role.name}}" },
				{ name: "Color", value: "{{role.color}}" },
				{ name: "Hoisted", value: "{{role.hoisted}}" },
				{ name: "Mentionable", value: "{{role.mentionable}}" },
			],
			color: "green",
			footer: { text: "Actor ID: {{actor.id}}" },
		}]
	}
);

export const roleUpdateEvent = eventConfig(
	messageTemplate(m.object({
		actor: UserView,
		old_role: RoleView,
		new_role: RoleView,
		name_changed: m.terminal(),
		color_changed: m.terminal(),
		hoisted_changed: m.terminal(),
		mentionable_changed: m.terminal(),
	})),
	{
		embeds: [{
			title: "Role Updated",
			author: { name: "{{actor.tag}}", icon_url: "{{actor.avatar}}" },
			description: "{{new_role.mention}}",
			fields: [
				{ name: "Name", value: "{{#name_changed}}{{old_role.name}} → {{new_role.name}}{{/name_changed}}" },
				{ name: "Color", value: "{{#color_changed}}{{old_role.color}} → {{new_role.color}}{{/color_changed}}" },
				{ name: "Hoisted", value: "{{#hoisted_changed}}{{old_role.hoisted}} → {{new_role.hoisted}}{{/hoisted_changed}}" },
				{ name: "Mentionable", value: "{{#mentionable_changed}}{{old_role.mentionable}} → {{new_role.mentionable}}{{/mentionable_changed}}" },
			],
			color: "yellow",
			footer: { text: "Actor ID: {{actor.id}}" },
		}]
	}
);

export const roleDeleteEvent = eventConfig(
	messageTemplate(m.object({
		actor: UserView,
		role: RoleView,
	})),
	{
		embeds: [{
			title: "Role Deleted",
			author: { name: "{{actor.tag}}", icon_url: "{{actor.avatar}}" },
			fields: [
				{ name: "Name", value: "{{role.name}}" },
				{ name: "Color", value: "{{role.color}}" },
				{ name: "Hoisted", value: "{{role.hoisted}}" },
				{ name: "Mentionable", value: "{{role.mentionable}}" },
			],
			color: "red",
			footer: { text: "Actor ID: {{actor.id}}" },
		}]
	}
);
