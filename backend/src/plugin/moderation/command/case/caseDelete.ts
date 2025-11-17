import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";
import { deleteCase } from "#plugin/moderation/storage/cases.ts";

export default defineCommand({
	name: ["casedelete", "casedel", "caserm", "deletecase", "delcase", "rmcase"],
	description: "Delete a recorded moderation case.",

	options: {
		number: {
			name: ["number", "n"],
			type: OptionType.Integer,
			required: true,
			position: 0,
		},
	},

	preRun: ctx => permissionsGuard(ctx, moderationConfigStore, permissions => permissions.case_delete),
	async run(ctx, { number }) {
		const deleted = await deleteCase(ctx.discordCtx.db, ctx.guild.id, number);

		if (deleted)
			await ctx.respond(`${icons.success} Deleted case **#${number}**!`);
		else
			await ctx.respond(`${icons.error} Case **#${number}** was not found!`);
	}
});
