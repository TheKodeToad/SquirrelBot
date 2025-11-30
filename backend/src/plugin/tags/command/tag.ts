import { escapeMarkdown } from "#common/discord/markdown.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { MAX_TAG_NAME_LENGTH } from "#plugin/tags/constants.ts";
import { autocompleteTags } from "#plugin/tags/helper/autocompletion.ts";
import { tagsConfigStore } from "#plugin/tags/index.ts";
import { getTag } from "#plugin/tags/storage/tags.ts";
import { Gallery, GalleryItem, Text } from "oceanic-component-helper";
import type { MessageComponent } from "oceanic.js";

export default defineCommand({
	name: ["tag", "tagsend", "sendtag"],
	trackUpdates: true,

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
			(permissions) => permissions.tagSend,
		),
	async run(ctx, { name }) {
		const tag = await getTag(ctx.squirrelCtx.db, ctx.guild.id, name);

		if (tag === null) {
			await ctx.respond(
				`${icons.error} Tag '${escapeMarkdown(name)}' could not be found!`,
			);
			return;
		}

		const components: MessageComponent[] = [Text(tag.content)];

		if (tag.attachments.length !== 0) {
			components.push(
				Gallery(
					tag.attachments.map((attachment) =>
						GalleryItem(attachment),
					),
				),
			);
		}

		await ctx.respond({ components });
	},
});
