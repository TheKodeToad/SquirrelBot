import { permissions_guard } from "../../core/public/command/helper.ts";
import { OptionType, define_command } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { util_config } from "../index.ts";

const DISCORD_EPOCH = BigInt(new Date(2015, 0, 1).getTime());

export const snowflake_command = define_command({
	id: "snowflake",
	track_updates: true,
	options: {
		input: {
			type: OptionType.SNOWFLAKE,
			id: ["input", "i"],
			required: true,
			position: 0,
		},
	},

	pre_run: context => permissions_guard(context, util_config, permissions => permissions.snowflake_command),
	async run(context, args) {
		const snowflake = BigInt(args.input);
		const timestamp = DISCORD_EPOCH + (snowflake >> 22n);
		await context.respond(`${icons.info} <t:${timestamp / 1000n}> (${timestamp} unix time)`);
	},
});