import { deleteCase } from "#db/moderation/cases.ts";
import { OptionType } from "#plugin/core/public/command.ts";
import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";

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

	preRun: context => permissionsGuard(context, moderationConfigStore, permissions => permissions.case_delete),
	async run(context, { number }) {
		const deleted = await deleteCase(context.guild.id, number);

		if (deleted)
			await context.respond(`${icons.success} Deleted case **#${number}**!`);
		else
			await context.respond(`${icons.error} Case **#${number}** does not exist!`);
	}
});
