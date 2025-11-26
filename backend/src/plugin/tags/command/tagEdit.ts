import { escapeMarkdown } from "#common/discord/markdown.ts";
import type { Nullable } from "#common/general.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import {
	MAX_TAG_CONTENT_LENGTH,
	MAX_TAG_NAME_LENGTH,
} from "#plugin/tags/constants.ts";
import { autocompleteTags } from "#plugin/tags/helper/autocompletion.ts";
import { tagsConfigStore } from "#plugin/tags/index.ts";
import { onTagEdited } from "#plugin/tags/public/extensionPoints.ts";
import type { Tag } from "#plugin/tags/public/tag.ts";
import { updateTag } from "#plugin/tags/storage/tags.ts";

const logger = moduleLogger();

export default defineCommand({
	name: ["tagedit", "edittag", "tagupdate", "updatetag"],
	description: "Edit an existing tag.",

	options: {
		name: {
			type: OptionType.String,
			name: ["name", "n"],
			description: "The name of the tag to modify.",
			required: true,
			position: 0,
			maxLength: MAX_TAG_NAME_LENGTH,
			greedy: false,

			autocomplete: (ctx, value) => autocompleteTags(ctx, value),
		},
		content: {
			type: OptionType.String,
			name: ["content", "c"],
			position: 1,
			maxLength: MAX_TAG_CONTENT_LENGTH,
		},
		newName: {
			type: OptionType.String,
			name: ["new-name", "rename", "nn", "rn"],
			description: "Change the name of the tag to something else.",
			maxLength: MAX_TAG_NAME_LENGTH,
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			tagsConfigStore,
			(permissions) => permissions.tagEdit,
		),
	async run(ctx, args) {
		const changes = {
			name: args.newName,
			content: args.content,
		};

		const oldTag = await updateTag(
			ctx.squirrelCtx.db,
			ctx.guild.id,
			args.name,
			changes,
		);

		if (oldTag === null) {
			await ctx.respond(
				`${icons.error} Tag '${escapeMarkdown(args.name)}' does not exist!`,
			);
			return;
		}

		// check after we know the tag exists
		if (args.newName === null && args.content === null) {
			await ctx.respond(`${icons.error} No changes specified!`);
			return;
		}

		onTagEdited
			.fire(ctx.squirrelCtx, ctx.guild, ctx.member, oldTag, changes)
			.catch((error) => logger.error?.("Error in onTagDeleted", error));

		await ctx.respond(
			`${icons.success} Edited tag '${escapeMarkdown(args.name)}'!`,
		);
	},
});
