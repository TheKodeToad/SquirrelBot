import { OptionType } from "#plugin/core/discord/public/command.ts";
import { defineCommand } from "#plugin/core/discord/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/discord/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/discord/public/icons.ts";
import { formatCaseDescription, formatCaseFields } from "#plugin/moderation/discord/helper/format.ts";
import { moderationConfigStore } from "#plugin/moderation/index.ts";
import { getCase } from "#plugin/moderation/storage/cases.ts";
import { Container, Divider, Text } from "oceanic-component-helper";

export default defineCommand({
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

	preRun: context => permissionsGuard(context, moderationConfigStore, permissions => permissions.case_read),
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
