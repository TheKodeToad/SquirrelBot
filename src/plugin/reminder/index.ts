import { GuildChannel } from "oceanic.js";
import { can_write_in_channel } from "../../common/discord";
import { FlagType, define_command } from "../../core/types/command";
import { define_plugin } from "../../core/types/plugin";

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
					if (context.channel instanceof GuildChannel
						&& !can_write_in_channel(context.channel, context.channel.guild.clientMember)) {
						return;
					}

					await context.channel.createMessage(
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