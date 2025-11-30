import { escapeMarkdown } from "#common/discord/markdown.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import {
	MAX_TAG_CONTENT_LENGTH,
	MAX_TAG_NAME_LENGTH,
} from "#plugin/tags/constants.ts";
import { tagsConfigStore } from "#plugin/tags/index.ts";
import { onTagCreated } from "#plugin/tags/public/extensionPoints.ts";
import { createTag } from "#plugin/tags/storage/tags.ts";

const logger = moduleLogger();

export default defineCommand({
	name: ["tagcreate", "createtag", "tagnew", "newtag"],
	description: "Create a new tag.",

	options: {
		name: {
			type: "string",
			name: ["name", "n"],
			description: "The name of the tag to create.",
			required: true,
			position: 0,
			maxLength: MAX_TAG_NAME_LENGTH,
			greedy: false,
		},
		content: {
			type: "string",
			name: ["content", "c"],
			required: true,
			position: 1,
			maxLength: MAX_TAG_CONTENT_LENGTH,
		},
		attachments: {
			type: "string",
			name: ["attachments", "a", "attachment", "attach"],
			array: true,
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			tagsConfigStore,
			(permissions) => permissions.tagCreate,
		),
	async run(ctx, args) {
		const success = await createTag(ctx.squirrelCtx.db, ctx.guild.id, {
			name: args.name,
			content: args.content,
			attachments: args.attachments ?? [],
		});

		if (!success) {
			await ctx.respond(
				`${icons.error} Tag '${escapeMarkdown(args.name)}' already exists!`,
			);
			return;
		}

		onTagCreated
			.fire(ctx.squirrelCtx, ctx.guild, ctx.member, args)
			.catch((error) => logger.error?.("Error in onTagCreated", error));

		await ctx.respond(
			`${icons.success} Created tag '${escapeMarkdown(args.name)}'!`,
		);
	},
});
