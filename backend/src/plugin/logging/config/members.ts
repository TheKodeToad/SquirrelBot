import { messageTemplate } from "#common/schema/message.ts";
import { UserView } from "#common/template/user.ts";
import { eventConfig } from "#plugin/logging/config/index.ts";
import { m } from "mousetache";

export const MemberJoinEvent = eventConfig(
	messageTemplate(m.object({ user: UserView })),
	{
		embeds: [
			{
				title: "Member Joined",
				author: { name: "{{user.tag}}", icon_url: "{{user.avatar}}" },
				fields: [
					{
						name: "Account Created At",
						value:
							"{{#user.created_at}}{{.}} ({{user.age}} old){{/user.created_at}}",
					},
				],
				color: "green",
				footer: { text: "User ID: {{user.id}}" },
			},
		],
	},
);

export const MemberLeaveEvent = eventConfig(
	messageTemplate(m.object({ user: UserView })),
	{
		embeds: [
			{
				title: "Member Left",
				author: { name: "{{user.tag}}", icon_url: "{{user.avatar}}" },
				fields: [
					{
						name: "Joined At",
						value:
							"{{#user.joined_at}}{{.}} (stayed for {{user.membership_duration}}){{/user.joined_at}}",
					},
				],
				color: "red",
				footer: { text: "User ID: {{user.id}}" },
			},
		],
	},
);
