import { WEEK } from "#common/time.ts";
import { isUndeletableMessageType } from "#discord/common/general.ts";
import { bot } from "#discord/index.ts";
import { OptionType, defineCommand } from "#plugin/core/public/command.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { moderationConfig } from "#plugin/moderation/index.ts";

export const purgeCommand = defineCommand({
	name: ["purge", "sweep", "clear"],
	description: "Delete the specified number of messages in chat starting from the most recent.",

	options: {
		count: {
			type: OptionType.Integer,
			description: "The limit of messages to delete.",
			name: ["count", "c"],
			position: 0,
			required: true,
		},
		match: {
			type: OptionType.String,
			name: ["match", "m"],
			position: 1,
		},
		bots: {
			type: OptionType.Flag,
			name: ["bots"],
		},
		humans: {
			type: OptionType.Flag,
			name: ["humans"],
		},
		author: {
			type: OptionType.User,
			name: ["author", "a", "by", "from"],
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
			const twoWeeksAgo = Date.now() - (2 * WEEK);

			for (const message of messages) {
				if (message.createdAt.getTime() < twoWeeksAgo) {
					stop = true;
					break;
				}

				if (isUndeletableMessageType(message.type))
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
			await context.respond(`${icons.success} Purged **${purged} messages**!`);
	},
});
