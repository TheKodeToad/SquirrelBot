import { UndeletableMessageTypes } from "oceanic.js";
import { bot } from "../../../index.ts";
import { permissions_guard } from "../../core/public/command/helper.ts";
import { OptionType, define_command } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { resolve_permissions } from "../../core/public/permission_resolution.ts";
import { moderation_config } from "../index.ts";

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

	pre_run: context => permissions_guard(context, moderation_config, permissions => permissions.purge),
	async run(context, args) {
		const config = moderation_config.get(context.guild.id);

		if (config === undefined)
			return;

		const perms = resolve_permissions(config, context.member, context.channel);

		if (!perms.purge)
			return;

		let purged = 0;

		const iter = bot.rest.channels.getMessagesIterator(context.channel.id, {
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

			await context.channel.deleteMessages(to_delete);
			purged += to_delete.length;

			if (stop)
				break;
		}

		if (purged === 0)
			await context.respond(`${icons.error} No messages were purged!`);
		else
			await context.respond(`${icons.success} Purged ${purged} messages!`);
	},
});