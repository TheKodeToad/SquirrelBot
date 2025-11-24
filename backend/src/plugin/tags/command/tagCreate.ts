import { escapeMarkdown } from "#common/discord/markdown.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import {
	MAX_TAG_CONTENT_LENGTH,
	MAX_TAG_NAME_LENGTH,
} from "#plugin/tags/constants.ts";
import { tagsConfigStore } from "#plugin/tags/index.ts";
import { createTag } from "#plugin/tags/storage/tags.ts";

export default defineCommand({
	name: ["tagcreate", "createtag", "tagnew", "newtag"],
	description: "Create a new tag.",

	options: {
		name: {
			type: OptionType.String,
			name: ["name", "n"],
			description: "The name of the tag to create.",
			required: true,
			position: 0,
			maxLength: MAX_TAG_NAME_LENGTH,
			greedy: false,
		},
		content: {
			type: OptionType.String,
			name: ["content", "c"],
			required: true,
			position: 1,
			maxLength: MAX_TAG_CONTENT_LENGTH,
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			tagsConfigStore,
			(permissions) => permissions.tag_create,
		),
	async run(ctx, args) {
		const success = await createTag(
			ctx.squirrelCtx.db,
			ctx.guild.id,
			args.name,
			args.content,
		);

		if (success) {
			await ctx.respond(
				`${icons.success} Created tag '${escapeMarkdown(args.name)}'!`,
			);
		} else {
			await ctx.respond(
				`${icons.error} Tag '${escapeMarkdown(args.name)}' already exists!`,
			);
		}
	},
});
