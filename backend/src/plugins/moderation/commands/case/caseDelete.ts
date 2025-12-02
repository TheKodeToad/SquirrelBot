import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { moderationConfigStore } from "#plugins/moderation/plugin.ts";
import { deleteCase } from "#plugins/moderation/storage/cases.ts";

export default defineCommand({
	name: [
		"casedelete",
		"deletecase",
		"casedel",
		"delcase",
		"caserm",
		"rmcase",
	],
	description: "Delete a recorded moderation case.",

	options: {
		number: {
			name: ["number", "n"],
			type: "integer",
			required: true,
			position: 0,
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			moderationConfigStore,
			(perms) => perms.caseDelete,
		),
	async run(ctx, { number }) {
		const deleted = await deleteCase(
			ctx.backendCtx.db,
			ctx.guild.id,
			number,
		);

		if (deleted) {
			await ctx.respond(`${icons.success} Deleted case **#${number}**!`);
		} else {
			await ctx.respond(
				`${icons.error} Case **#${number}** was not found!`,
			);
		}
	},
});
