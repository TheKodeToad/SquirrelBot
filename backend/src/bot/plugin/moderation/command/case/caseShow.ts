import { OptionType, defineCommand } from "#bot/plugin/core/public/command.ts";
import { permissionsGuard } from "#bot/plugin/core/public/helper/commandGuards.ts";
import { icons } from "#bot/plugin/core/public/icons.ts";
import { formatCaseDescription, formatCaseFields } from "#bot/plugin/moderation/helper/format.ts";
import { moderationConfig } from "#bot/plugin/moderation/index.ts";
import { getCase } from "#db/moderation/cases.ts";
import { Container, Divider, Text } from "oceanic-component-helper";

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

		await context.respond({
			components: [Container([
				Text(await formatCaseDescription(info, true)),
				Divider(),
				Text(await formatCaseFields(info)),
			])]
		});
	},
});
