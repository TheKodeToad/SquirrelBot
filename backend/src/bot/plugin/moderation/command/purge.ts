import { AnyTextableGuildChannel, Permissions, UndeletableMessageTypes } from "oceanic.js";
import { bot } from "../../..";
import { Icons } from "../../../core/icons";
import { OptionType, define_command } from "../../../core/types/command";

export const purge_command = define_command({
	id: ["purge", "sweep", "clear"],
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
		bots: {
			id: "bots",
			type: OptionType.VOID,
		},
		humans: {
			id: "humans",
			type: OptionType.VOID,
		},
		author: {
			id: ["author", "a", "by", "from"],
			type: OptionType.USER,
			array: true,
		}
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

				if (UndeletableMessageTypes.some(type => type === message.type))
					continue;

				if (args.match !== null && !message.content.includes(args.match))
					continue;

				const by_bot = message.author.bot || message.webhookID !== undefined; // TODO: maybe slightly annoying with PluralKit/Tupperbox?

				if (args.bots && !by_bot)
					continue;

				if (args.humans && by_bot)
					continue;

				if (args.author.length !== 0 && !args.author.includes(message.author.id))
					continue;

				to_delete.push(message.id);
			}

			await channel.deleteMessages(to_delete);
			purged += to_delete.length;

			if (stop)
				break;
		}

		if (purged === 0)
			await context.respond(`${Icons.error} No messages were purged!`);
		else
			await context.respond(`${Icons.success} Purged ${purged} messages!`);
	},
});