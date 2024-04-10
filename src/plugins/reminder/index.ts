import { Client } from "discord.js";
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
			async run({ seconds, message }, context) {
				await context.respond(`:white_check_mark: Reminder set for <t:${Math.floor(Date.now() / 1000 + seconds)}:R>: '${message}'!`);
				setTimeout(async () => {
					await context.channel?.send({
						content: `:bell: Reminder for <@${context.user.id}>: ${message}`,
						allowedMentions: { users: [context.user.id] }
					});
				}, seconds * 1000);
			}
		})
	],
});