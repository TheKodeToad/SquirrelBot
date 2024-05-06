import { bot } from "../..";
import { can_write_in_channel } from "../../common/discord";
import { OptionType, define_command } from "../../core/types/command";
import { define_plugin } from "../../core/types/plugin";

export const reminder_plugin = define_plugin({
	id: "reminder",
	commands: [
		define_command({
			id: "remind",
			options: {
				seconds: {
					type: OptionType.NUMBER,
					id: "seconds",
					primary: true,
					required: true,
				},
				message: {
					type: OptionType.STRING,
					id: "message",
					required: true,
				}
			},
			async run(context, { seconds, message }) {
				await context.respond(`:white_check_mark: Reminder set for <t:${Math.floor(Date.now() / 1000 + seconds)}:R>: '${message}'!`);
				setTimeout(async () => {
					if (context.guild !== null) {
						const channel = context.guild.channels.get(context.channel_id);
						if (channel !== undefined && !can_write_in_channel(channel, context.guild.clientMember))
							return;
					}

					await bot.rest.channels.createMessage(
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