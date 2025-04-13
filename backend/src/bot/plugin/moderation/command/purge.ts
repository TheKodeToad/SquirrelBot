import { UndeletableMessageTypes } from "oceanic.js";
import { bot } from "../../../index.ts";
import { permissionsGuard } from "../../core/public/command/helper.ts";
import { OptionType, defineCommand } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { moderationConfig } from "../index.ts";

export const purgeCommand = defineCommand({
	name: ["purge", "sweep", "clear"],
	options: {
		count: {
			name: ["count", "c"],
			type: OptionType.Integer,
			position: 0,
			required: true,
		},
		match: {
			name: ["match", "m"],
			type: OptionType.String,
			position: 1,
		},
		bots: {
			name: ["bots"],
			type: OptionType.Flag,
		},
		humans: {
			name: ["humans"],
			type: OptionType.Flag,
		},
		author: {
			name: ["author", "a", "by", "from"],
			type: OptionType.User,
			array: true,
		}
	},

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.purge),
	async run(context, args) {
		let purged = 0;

		const iter = bot.rest.channels.getMessagesIterator(context.channel.id, {
			limit: args.count,
			before: context.message?.id,
		});

		for await (const messages of iter) {
			let stop = false;

			const toDelete: string[] = [];
			const twoWeeksAgo = Date.now() - (1000 * 60 * 60 * 24 * 14);

			for (const message of messages) {
				if (message.createdAt.getTime() < twoWeeksAgo) {
					stop = true;
					break;
				}

				if (UndeletableMessageTypes.some(type => type === message.type))
					continue;

				if (args.match !== null && !message.content.includes(args.match))
					continue;

				const byBot = message.author.bot || message.webhookID !== undefined; // TODO: maybe slightly annoying with PluralKit/Tupperbox?

				if (args.bots && !byBot)
					continue;

				if (args.humans && byBot)
					continue;

				if (args.author.length !== 0 && !args.author.includes(message.author.id))
					continue;

				toDelete.push(message.id);
			}

			await context.channel.deleteMessages(toDelete);
			purged += toDelete.length;

			if (stop)
				break;
		}

		if (purged === 0)
			await context.respond(`${icons.error} No messages were purged!`);
		else
			await context.respond(`${icons.success} Purged ${purged} messages!`);
	},
});