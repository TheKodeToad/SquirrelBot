import type { EmbedField } from "oceanic.js";
import { getCase } from "../../../../../db/moderation/cases.ts";
import { Colors } from "../../../../common/discord/colors.ts";
import { formatUser } from "../../../../common/discord/format.ts";
import { permissionsGuard } from "../../../core/public/command/helper.ts";
import { OptionType, defineCommand } from "../../../core/public/command/index.ts";
import { icons } from "../../../core/public/icons.ts";
import { caseTypeName } from "../../helper/cases.ts";
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

		const fields: EmbedField[] = [];

		const creationSecs = Math.floor(info.createdAt.getTime() / 1000);

		fields.push({
			name: "Created At",
			value: `<t:${creationSecs}> (<t:${creationSecs}:R>)`,
		});

		if (info.expiresAt !== null) {
			const expirySecs = Math.floor(info.expiresAt.getTime() / 1000);

			fields.push({
				name: "Expires At",
				value: `<t:${expirySecs}> (<t:${expirySecs}:R>)`
			});
		}

		fields.push(
			{
				name: "Type",
				value: caseTypeName(info.type)
			},
			{
				name: "Actor",
				value: await formatUser(info.actorID)
			},
			{
				name: "Target",
				value: await formatUser(info.targetID)
			},
			{
				name: "Reason",
				value: info.reason ?? "*None provided*",
			},
		);

		await context.respond({
			embeds: [{
				color: Colors.blurple,
				title: `Case #${number}`,
				fields
			}]
		});
	},
});