import { messageTemplate } from "#common/schemas/message.ts";
import { UserView } from "#common/views/user.ts";
import { eventConfig } from "#plugins/logging/config.ts";
import { MemberEventView } from "#plugins/logging/loggers/members/views.ts";
import { m } from "mousetache";

export const MemberJoinEvent = eventConfig(messageTemplate(MemberEventView), {
	embeds: [
		{
			title: "Member Joined",
			author: { name: "{{user.tag}}", iconURL: "{{user.avatar}}" },
			fields: [
				{
					name: "Account Created At",
					value: "{{#user.createdAt}}{{.}} ({{user.age}} old){{/user.createdAt}}",
				},
			],
			color: "green",
			footer: { text: "User ID: {{user.id}}" },
		},
	],
});

export const MemberLeaveEvent = eventConfig(
	messageTemplate(m.object({ user: UserView })),
	{
		embeds: [
			{
				title: "Member Left",
				author: { name: "{{user.tag}}", iconURL: "{{user.avatar}}" },
				fields: [
					{
						name: "Joined At",
						value: "{{#user.joinedAt}}{{.}} (stayed for {{user.membershipDuration}}){{/user.joinedAt}}",
					},
				],
				color: "red",
				footer: { text: "User ID: {{user.id}}" },
			},
		],
	},
);
