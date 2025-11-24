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
import {
	createTag,
	searchTags,
	updateTag,
	upsertTag,
} from "#plugin/tags/storage/tags.ts";

export default defineCommand({
	name: ["tagset", "settag"],
	description: "Create or edit a tag.",

	options: {
		name: {
			type: OptionType.String,
			name: ["name", "n"],
			description:
				"The name of the tag - a tag with this name will be created if it doesn't currently exist.",
			required: true,
			position: 0,
			maxLength: MAX_TAG_NAME_LENGTH,
			greedy: false,

			autocomplete: (ctx, value) =>
				searchTags(ctx.squirrelCtx.db, ctx.guild.id, value),
		},
		content: {
			type: OptionType.String,
			name: ["content", "c"],
			required: true,
			position: 1,
			maxLength: MAX_TAG_CONTENT_LENGTH,
		},
		existing: {
			type: OptionType.Flag,
			name: ["existing"],
			description:
				"Only set the tag if it already exists; don't create a new one.",
		},
		new: {
			type: OptionType.Flag,
			name: ["new"],
			description:
				"Only set the tag if it doesn't already exist; fail unless creating a new one.",
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			tagsConfigStore,
			(permissions) => permissions.tag_create || permissions.tag_edit,
		),
	async run(ctx, args, { permissions }) {
		if (args.existing || !permissions.tag_create) {
			const success = await updateTag(
				ctx.squirrelCtx.db,
				ctx.guild.id,
				args.name,
				args.content,
			);

			if (success) {
				await ctx.respond(
					`${icons.success} Edited tag '${escapeMarkdown(args.name)}'!`,
				);
			} else {
				await ctx.respond(
					`${icons.error} Tag '${escapeMarkdown(args.name)}' does not exist!`,
				);
			}
		} else if (args.new || !permissions.tag_edit) {
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
		} else {
			const { inserted } = await upsertTag(
				ctx.squirrelCtx.db,
				ctx.guild.id,
				args.name,
				args.content,
			);

			if (inserted) {
				await ctx.respond(
					`${icons.success} Created tag '${escapeMarkdown(args.name)}'!`,
				);
			} else {
				await ctx.respond(
					`${icons.success} Edited tag '${escapeMarkdown(args.name)}'!`,
				);
			}
		}
	},
});
