import { AnyTextableGuildChannel, MessageTypes, Permissions } from "oceanic.js";
import { bot } from "../../..";
import { OptionType, define_command } from "../../../core/types/command";

const UNDELETABLE_MESSAGE_TYPES: MessageTypes[] = [
	MessageTypes.RECIPIENT_ADD,
	MessageTypes.RECIPIENT_REMOVE,
	MessageTypes.CALL,
	MessageTypes.CHANNEL_NAME_CHANGE,
	MessageTypes.CHANNEL_ICON_CHANGE,
	MessageTypes.THREAD_STARTER_MESSAGE,
];

export const purge_command = define_command({
	id: "purge",
	options: {
		count: {
			id: ["count", "c"],
			type: OptionType.INTEGER,
			position: 0,
			required: true,
		},
		match: {
			id: ["match", "m"],
			type: OptionType.STRING,
			position: 1,
		},
	},
	async run(context, args) {
		if (context.guild === null || context.member === null)
			return;

		const channel = (
			context.guild.channels.get(context.channel_id)
			?? context.guild.threads.get(context.channel_id)
		) as AnyTextableGuildChannel | undefined;

		if (channel === undefined)
			return;

		if (!channel.permissionsOf(context.member).has(Permissions.MANAGE_MESSAGES))
			return;

		let purged = 0;

		const iter = bot.rest.channels.getMessagesIterator(context.channel_id, {
			limit: args.count,
			before: context.message?.id,
		});

		for await (const messages of iter) {
			let stop = false;

			const to_delete: string[] = [];
			const two_weeks_ago = Date.now() - (1000 * 60 * 60 * 24 * 14);

			for (const message of messages) {
				if (message.createdAt.getTime() < two_weeks_ago) {
					stop = true;
					break;
				}

				if (UNDELETABLE_MESSAGE_TYPES.includes(message.type))
					continue;

				if (args.match !== null && !message.content.includes(args.match))
					continue;

				to_delete.push(message.id);
			}

			await channel.deleteMessages(to_delete);
			purged += to_delete.length;

			if (stop)
				break;
		}

		if (purged === 0)
			await context.respond(":x: No messages were purged!");
		else
			await context.respond(`:white_check_mark: Purged ${purged} messages!`);
	},
});