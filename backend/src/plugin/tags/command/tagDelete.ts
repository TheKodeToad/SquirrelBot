import { escapeMarkdown } from "#common/discord/markdown.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { MAX_TAG_NAME_LENGTH } from "#plugin/tags/constants.ts";
import { autocompleteTags } from "#plugin/tags/helper/autocompletion.ts";
import { tagsConfigStore } from "#plugin/tags/index.ts";
import { onTagDeleted } from "#plugin/tags/public/extensionPoints.ts";
import { deleteTag } from "#plugin/tags/storage/tags.ts";

const logger = moduleLogger();

export default defineCommand({
	name: ["tagdelete", "deletetag", "tagdel", "deltag", "tagrm", "rmtag"],
	description: "Delete a tag.",

	options: {
		name: {
			type: "string",
			name: ["name", "n"],
			required: true,
			position: 0,
			maxLength: MAX_TAG_NAME_LENGTH,

			autocomplete: (ctx, value) => autocompleteTags(ctx, value),
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			tagsConfigStore,
			(permissions) => permissions.tagDelete,
		),
	async run(ctx, args) {
		const tag = await deleteTag(
			ctx.squirrelCtx.db,
			ctx.guild.id,
			args.name,
		);

		if (tag === null) {
			await ctx.respond(
				`${icons.error} Tag '${escapeMarkdown(args.name)}' does not exist!`,
			);
			return;
		}

		onTagDeleted
			.fire(ctx.squirrelCtx, ctx.guild, ctx.member, tag)
			.catch((error) => logger.error?.("Error in onTagDeleted", error));

		await ctx.respond(
			`${icons.success} Deleted tag '${escapeMarkdown(args.name)}'!`,
		);
	},
});
