import type { EmbedOptions } from "oceanic.js";
import { dateToUnixSeconds } from "../../../../../common/time.ts";
import { getCase } from "../../../../../db/moderation/cases.ts";
import { Colors } from "../../../../common/discord/colors.ts";
import { formatUserByID } from "../../../../common/discord/format.ts";
import { OptionType, defineCommand } from "../../../core/public/command.ts";
import { permissionsGuard } from "../../../core/public/helper/commandGuards.ts";
import { icons } from "../../../core/public/icons.ts";
import { formatCaseSummary, formatCaseTitle } from "../../helper/cases.ts";
import { moderationConfig } from "../../index.ts";

export const caseShowCommand = defineCommand({
	name: ["caseshow", "case", "showcase"],
	options: {
		number: {
			name: ["number", "n"],
			type: OptionType.Integer,
			required: true,
			position: 0,
		},
	},
	trackUpdates: true,

	preRun: context => permissionsGuard(context, moderationConfig, permissions => permissions.case_read),
	async run(context, { number }) {
		const info = await getCase(context.guild.id, number);

		if (info === null) {
			await context.respond(`${icons.error} Case #${number} not found!`);
			return;
		}

		const embed: EmbedOptions = {
			title: formatCaseTitle(info, info.expiresAt !== null && info.expiresAt.getTime() <= Date.now()),
			color: Colors.blurple
		};

		embed.description = await formatCaseSummary(info);

		embed.fields = [];

		const creationSecs = dateToUnixSeconds(info.createdAt);

		embed.fields.push(
			{
				name: "Moderator",
				value: await formatUserByID(info.actorID),
			},
			{
				name: "Performed At",
				value: `<t:${creationSecs}> (<t:${creationSecs}:R>)`,
			}
		);

		if (info.expiresAt !== null) {
			const expirySecs = dateToUnixSeconds(info.expiresAt);

			embed.fields.push({
				name: "Expires At",
				value: `<t:${expirySecs}> (<t:${expirySecs}:R>)`,
			});
		}

		await context.respond({
			embeds: [embed]
		});
	},
});