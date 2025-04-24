import { OptionType, defineCommand } from "../../core/public/command.ts";
import { permissionsGuard } from "../../core/public/helper/commandGuards.ts";
import { icons } from "../../core/public/icons.ts";
import { utilConfig } from "../index.ts";

const DISCORD_EPOCH = BigInt(new Date(2015, 0, 1).getTime());

export const snowflakeCommand = defineCommand({
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

	preRun: context => permissionsGuard(context, utilConfig, permissions => permissions.snowflake_command),
	async run(context, args) {
		const snowflake = BigInt(args.input);
		const timestamp = DISCORD_EPOCH + (snowflake >> 22n);
		await context.respond(`${icons.info} <t:${timestamp / 1000n}> (${timestamp} unix time)`);
	},
});