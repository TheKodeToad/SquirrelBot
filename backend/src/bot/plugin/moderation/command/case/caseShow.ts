import { ComponentTypes } from "oceanic.js";
import { getCase } from "../../../../../db/moderation/cases.ts";
import { OptionType, defineCommand, type CommandContainerComponent } from "../../../core/public/command.ts";
import { permissionsGuard } from "../../../core/public/helper/commandGuards.ts";
import { icons } from "../../../core/public/icons.ts";
import { formatCaseDescription, formatCaseFields } from "../../helper/format.ts";
import { moderationConfig } from "../../index.ts";

export const caseShowCommand = defineCommand({
	name: ["caseshow", "case", "showcase"],
	description: "Show details of a specific moderation case",

	options: {
		number: {
			type: OptionType.Integer,
			name: ["number", "n"],
			required: true,
			position: 0,
		},
	},
	trackUpdates: true,

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.case_read),
	async run(context, { number }) {
		const info = await getCase(context.guild.id, number);

		if (info === null) {
			await context.respond(`${icons.error} Case **#${number}** not found!`);
			return;
		}

		const container: CommandContainerComponent = {
			components: [],
			type: ComponentTypes.CONTAINER,
		};

		container.components.push({
			content: await formatCaseDescription(info, true),
			type: ComponentTypes.TEXT_DISPLAY,
		});

		container.components.push({ type: ComponentTypes.SEPARATOR });

		container.components.push({
			content: await formatCaseFields(info),
			type: ComponentTypes.TEXT_DISPLAY,
		});

		await context.respond({ components: [container] });
	},
});
