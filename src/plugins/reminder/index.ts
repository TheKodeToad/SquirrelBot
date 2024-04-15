import { ChannelTypes } from "oceanic.js";
import { FlagType, define_command, define_plugin } from "../../plugin/types";

export const reminder_plugin = define_plugin({
	id: "reminder",
	commands: [
		define_command({
			id: "remind",
			flags: {
				seconds: {
					type: FlagType.NUMBER,
					id: "seconds",
					primary: true,
					required: true,
				},
				message: {
					type: FlagType.STRING,
					id: "message",
					required: true,
				}
			},
			async run(context, { seconds, message }) {
				if (!context.channel || context.channel?.type === ChannelTypes.GROUP_DM)
					return;

				const { channel } = context;

				await context.respond(`:white_check_mark: Reminder set for <t:${Math.floor(Date.now() / 1000 + seconds)}:R>: '${message}'!`);
				setTimeout(async () => {
					await channel.createMessage({
						content: `:bell: Reminder for <@${context.user.id}>: ${message}`,
						allowedMentions: { users: [context.user.id] }
					});
				}, seconds * 1000);
			}
		})
	],
});