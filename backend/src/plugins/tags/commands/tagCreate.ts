import { escapeMarkdown } from "#common/discord/markdown.ts";
import { moduleLogger } from "#common/logger/logger.ts";
import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import {
	MAX_TAG_CONTENT_LENGTH,
	MAX_TAG_NAME_LENGTH,
} from "#plugins/tags/constants.ts";
import { attachments, optionalColor } from "#plugins/tags/customOptionTypes.ts";
import { tagsConfigStore } from "#plugins/tags/plugin.ts";
import { onTagCreated } from "#plugins/tags/public/extensionPoints.ts";
import type { Tag } from "#plugins/tags/public/tag.ts";
import { createTag } from "#plugins/tags/storage/tags.ts";

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

			greedy: false,
			maxLength: MAX_TAG_NAME_LENGTH,
		},
		content: {
			type: "string",
			name: ["content", "c"],
			required: true,
			position: 1,

			maxLength: MAX_TAG_CONTENT_LENGTH,
		},
		attachments: {
			type: attachments,
			name: ["attachments", "a", "attachment", "attach"],
		},
		color: {
			type: optionalColor,
			name: ["color", "c"],
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			tagsConfigStore,
			(permissions) => permissions.tagCreate,
		),
	async run(ctx, args) {
		const tag: Tag = {
			name: args.name,
			content: args.content,
			attachments: args.attachments ?? [],
			color: args.color ?? -1,
		};
		const success = await createTag(ctx.backendCtx.db, ctx.guild.id, tag);

		if (!success) {
			await ctx.respond(
				`${icons.error} Tag '${escapeMarkdown(args.name)}' already exists!`,
			);
			return;
		}

		onTagCreated
			.fire(ctx.backendCtx, ctx.guild, ctx.member, tag)
			.catch((error) => logger.error?.("Error in onTagCreated", error));

		await ctx.respond(
			`${icons.success} Created tag '${escapeMarkdown(args.name)}'!`,
		);
	},
});
