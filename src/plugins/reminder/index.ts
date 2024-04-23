import { client } from "../..";
import { define_plugin } from "../../plugin";
import { FlagType, define_command } from "../../plugin/command";

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
				await context.respond(`:white_check_mark: Reminder set for <t:${Math.floor(Date.now() / 1000 + seconds)}:R>: '${message}'!`);
				setTimeout(async () => {
					await client.rest.channels.createMessage(
						context.channel_id,
						{
							content: `:bell: Reminder for <@${context.user.id}>: ${message}`,
							allowedMentions: { users: [context.user.id] }
						}
					);
				}, seconds * 1000);
			}
		})
	],
});