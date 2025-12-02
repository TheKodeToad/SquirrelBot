import { escapeMarkdown } from "#common/discord/markdown.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugins/core/public/helper/commandGuards.ts";
import { icons } from "#plugins/core/public/icons.ts";
import {
	MAX_TAG_CONTENT_LENGTH,
	MAX_TAG_NAME_LENGTH,
} from "#plugins/tags/constants.ts";
import { autocompleteTags } from "#plugins/tags/helper/autocompletion.ts";
import {
	attachments,
	optionalColor,
} from "#plugins/tags/helper/customOptionTypes.ts";
import { tagsConfigStore } from "#plugins/tags/index.ts";
import { onTagEdited } from "#plugins/tags/public/extensionPoints.ts";
import { updateTag } from "#plugins/tags/storage/tags.ts";

const logger = moduleLogger();

export default defineCommand({
	name: ["tagedit", "edittag", "tagupdate", "updatetag"],
	description: "Edit an existing tag.",

	options: {
		name: {
			type: "string",
			name: ["name", "n"],
			description: "The name of the tag to modify.",
			required: true,
			position: 0,

			greedy: false,
			maxLength: MAX_TAG_NAME_LENGTH,

			autocomplete: (ctx, value) => autocompleteTags(ctx, value),
		},
		newName: {
			type: "string",
			name: ["new-name", "rename", "nn", "rn"],
			description: "Specify a new name to rename to.",

			maxLength: MAX_TAG_NAME_LENGTH,
		},
		content: {
			type: "string",
			name: ["content", "c"],
			description: "Modify the content.",
			position: 1,

			maxLength: MAX_TAG_CONTENT_LENGTH,
		},
		attachments: {
			type: attachments,
			name: ["attachments", "attach", "a"],
			description:
				"Modify attachments, specified as links separated by spaces or simply 'clear' to remove them.",
		},
		color: {
			type: optionalColor,
			name: ["color", "c"],
			description: "Modify the color of the tag. This will display ",
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
			attachments: args.attachments,
			color: args.color,
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
		if (
			changes.name === null &&
			changes.content === null &&
			changes.attachments === null &&
			changes.color === null
		) {
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
