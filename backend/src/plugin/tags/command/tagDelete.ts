import { escapeMarkdown } from "#common/discord/markdown.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { tagsConfigStore } from "#plugin/tags/index.ts";
import { deleteTag, searchTags } from "#plugin/tags/storage/tags.ts";

export default defineCommand({
	name: ["tagdelete", "deletetag", "tagdel", "deltag", "tagrm", "rmtag"],
	description: "Delete a tag.",

	options: {
		name: {
			type: OptionType.String,
			name: ["name", "n"],
			required: true,
			position: 0,

			autocomplete: (ctx, value) =>
				searchTags(ctx.squirrelCtx.db, ctx.guild.id, value),
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			tagsConfigStore,
			(permissions) => permissions.tag_delete,
		),
	async run(ctx, args) {
		const success = await deleteTag(
			ctx.squirrelCtx.db,
			ctx.guild.id,
			args.name,
		);

		if (success) {
			await ctx.respond(
				`${icons.success} Deleted tag '${escapeMarkdown(args.name)}'!`,
			);
		} else {
			await ctx.respond(
				`${icons.error} Tag '${escapeMarkdown(args.name)}' does not exist!`,
			);
		}
	},
});
