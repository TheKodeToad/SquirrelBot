import { escapeMarkdown } from "#common/discord/markdown.ts";
import { moduleLogger } from "#common/logger/logger.ts";
import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { autocompleteTags } from "#plugins/tags/autocompletion.ts";
import { MAX_TAG_NAME_LENGTH } from "#plugins/tags/constants.ts";
import { tagsConfigStore } from "#plugins/tags/plugin.ts";
import { onTagDeleted } from "#plugins/tags/public/extensionPoints.ts";
import { tagsTable } from "#plugins/tags/storage/tags.ts";

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
		permissionsGuard(ctx, tagsConfigStore, (perms) => perms.tagDelete),
	async run(ctx, args) {
		const tag = await tagsTable.remove(
			ctx.backendCtx.db,
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
			.fire(ctx.backendCtx, ctx.guild, ctx.member, tag)
			.catch((error) => logger.error?.("Error in onTagDeleted", error));

		await ctx.respond(
			`${icons.success} Deleted tag '${escapeMarkdown(args.name)}'!`,
		);
	},
});
