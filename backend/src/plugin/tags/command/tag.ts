import { escapeMarkdown } from "#common/discord/markdown.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { tagsConfigStore } from "#plugin/tags/index.ts";
import { getTag } from "#plugin/tags/storage/tags.ts";

export default defineCommand({
	name: ["tag", "tagsend", "sendtag"],

	options: {
		name: {
			type: OptionType.String,
			name: ["name", "n"],
			required: true,
			position: 0,
		}
	},

	preRun: ctx => permissionsGuard(ctx, tagsConfigStore, permissions => permissions.tag_send),
	async run(ctx, { name }) {
		const tag = await getTag(ctx.squirrelCtx.db, ctx.guild.id, name);

		if (tag === null) {
			await ctx.respond(`${icons.error} Tag '${escapeMarkdown(name)}' could not be found!`);
			return;
		}

		await ctx.respond(tag.content);
	}
});
