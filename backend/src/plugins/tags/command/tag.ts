import { escapeMarkdown } from "#common/discord/markdown.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugins/core/public/helper/commandGuards.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { MAX_TAG_NAME_LENGTH } from "#plugins/tags/constants.ts";
import { autocompleteTags } from "#plugins/tags/helper/autocompletion.ts";
import { tagsConfigStore } from "#plugins/tags/index.ts";
import { getTag } from "#plugins/tags/storage/tags.ts";
import {
	Container,
	Gallery,
	GalleryItem,
	Text,
} from "oceanic-component-helper";

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

		const container = Container([Text(tag.content)]);

		if (tag.color !== -1) {
			container.accentColor = tag.color;
		}

		if (tag.attachments.length !== 0) {
			container.components.push(
				Gallery(
					tag.attachments.map((attachment) =>
						GalleryItem(attachment),
					),
				),
			);
		}

		await ctx.respond({ components: [container] });
	},
});
