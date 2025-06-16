import { OptionType } from "#plugin/core/public/discord/command.ts";
import { defineCommand } from "#plugin/core/public/discord/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/discord/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/discord/icons.ts";
import { utilConfigStore } from "#plugin/util/index.ts";

const DISCORD_EPOCH = BigInt(new Date(2015, 0, 1).getTime());

export default defineCommand({
	name: ["snowflake", "snowflakeinfo", "creation"],
	description: "Calculate the creation date of something on Discord based on its ID.",

	trackUpdates: true,
	options: {
		input: {
			type: OptionType.Snowflake,
			description: "The Discord ID of a channel, user or something else.",
			name: ["input", "i"],
			required: true,
			position: 0,
		},
	},

	preRun: context => permissionsGuard(context, utilConfigStore, permissions => permissions.snowflake_command),
	async run(context, args) {
		const snowflake = BigInt(args.input);
		const timestamp = DISCORD_EPOCH + (snowflake >> 22n);
		await context.respond(`${icons.info} **<t:${timestamp / 1000n}>** (${timestamp} unix time)`);
	},
});
