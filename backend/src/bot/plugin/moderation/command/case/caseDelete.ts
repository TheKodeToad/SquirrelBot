import { deleteCase } from "../../../../../db/moderation/cases.ts";
import { permissionsGuard } from "../../../core/public/command/helper.ts";
import { defineCommand, OptionType } from "../../../core/public/command/index.ts";
import { icons } from "../../../core/public/icons.ts";
import { moderationConfig } from "../../index.ts";

export const deleteCaseCommand = defineCommand({
	name: ["casedelete", "casedel", "caserm", "deletecase", "delcase", "rmcase"],
	options: {
		number: {
			name: ["number", "n"],
			type: OptionType.Integer,
			required: true,
			position: 0,
		},
	},

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.case_delete),
	async run(context, { number }) {
		const deleted = await deleteCase(context.guild.id, number);

		if (deleted)
			await context.respond(`${icons.success} Deleted case #${number}!`);
		else
			await context.respond(`${icons.error} Case #${number} does not exist!`);
	}
});