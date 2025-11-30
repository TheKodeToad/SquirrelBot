import { isUndeletableMessageType } from "#common/discord/general.ts";
import { WEEK } from "#common/time.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";

export default defineCommand({
	name: ["purge", "sweep", "clear"],
	description:
		"Delete the specified number of messages in chat starting from the most recent.",

	options: {
		count: {
			type: "integer",
			description: "The limit of messages to delete.",
			name: ["count", "c"],
			position: 0,
			required: true,
		},
		match: {
			type: "string",
			description: "Only delete messages including the specified text.",
			name: ["match", "m"],
			position: 1,
		},
		apps: {
			type: "boolean",
			description: "How to handle apps.",
			name: ["apps", "a", "bots", "b"],
			negativeName: ["no-apps", "na", "no-bots", "nb", "humans"],
			values: ["include only apps", "exclude apps"],
		},
		author: {
			type: "user",
			name: ["author", "a", "by", "from"],
			array: true,
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			moderationConfigStore,
			(permissions) => permissions.purge,
		),
	async run(ctx, args) {
		let purged = 0;

		const iter = ctx.bot.rest.channels.getMessagesIterator(ctx.channel.id, {
			limit: args.count,
			before: ctx.message?.id,
		});

		for await (const messages of iter) {
			let stop = false;

			const toDelete: string[] = [];
			const twoWeeksAgo = Date.now() - 2 * WEEK;

			for (const message of messages) {
				if (message.createdAt.getTime() < twoWeeksAgo) {
					stop = true;
					break;
				}

				if (isUndeletableMessageType(message.type)) {
					continue;
				}

				if (
					args.match !== null &&
					!message.content.includes(args.match)
				) {
					continue;
				}

				const byBot =
					message.author.bot || message.webhookID !== undefined; // TODO: maybe slightly annoying with PluralKit/Tupperbox?

				if (args.apps !== null && args.apps !== byBot) {
					continue;
				}

				if (
					args.author.length !== 0 &&
					!args.author.includes(message.author.id)
				) {
					continue;
				}

				toDelete.push(message.id);
			}

			await ctx.channel.deleteMessages(toDelete);
			purged += toDelete.length;

			if (stop) {
				break;
			}
		}

		if (purged === 0) {
			await ctx.respond(`${icons.error} No messages were purged!`);
		} else {
			await ctx.respond(
				`${icons.success} Purged **${purged} messages**!`,
			);
		}
	},
});
