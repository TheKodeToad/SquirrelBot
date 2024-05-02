import { GuildChannel } from "oceanic.js";
import { bot } from "../..";
import { are_channel_parents_cached, can_write_in_channel, get_member_cached } from "../../common/discord";
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
						&& !(are_channel_parents_cached(context.channel)
							&& can_write_in_channel(context.channel, await get_member_cached(context.channel.guild, bot.user.id)))) {
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