import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugins/core/public/helper/commandGuards.ts";
import { icons } from "#plugins/core/public/icons.ts";
import {
	formatCaseDescription,
	formatCaseFields,
} from "#plugins/moderation/helper/format.ts";
import { moderationConfigStore } from "#plugins/moderation/index.ts";
import { getCase } from "#plugins/moderation/storage/cases.ts";
import { Container, Divider, Text } from "oceanic-component-helper";

export default defineCommand({
	name: ["caseshow", "case", "showcase"],
	description: "Show details of a specific moderation case",

	options: {
		number: {
			type: "integer",
			name: ["number", "n"],
			required: true,
			position: 0,
		},
	},
	trackUpdates: true,

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			moderationConfigStore,
			(permissions) => permissions.caseRead,
		),
	async run(ctx, { number }) {
		const info = await getCase(ctx.squirrelCtx.db, ctx.guild.id, number);

		if (info === null) {
			await ctx.respond(`${icons.error} Case **#${number}** not found!`);
			return;
		}

		await ctx.respond({
			components: [
				Container([
					Text(await formatCaseDescription(ctx.bot, info, true)),
					Divider(),
					Text(await formatCaseFields(ctx.bot, info)),
				]),
			],
		});
	},
});
