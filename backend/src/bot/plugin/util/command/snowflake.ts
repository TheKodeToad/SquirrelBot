import { permissionsGuard } from "../../core/public/command/helper.ts";
import { OptionType, defineCommand } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { utilConfig } from "../index.ts";

const DISCORD_EPOCH = BigInt(new Date(2015, 0, 1).getTime());

export const snowflakeCommand = defineCommand({
	name: ["snowflake"],
	trackUpdates: true,
	options: {
		input: {
			type: OptionType.Snowflake,
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