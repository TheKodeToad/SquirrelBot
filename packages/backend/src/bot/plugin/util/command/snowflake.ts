import { OptionType, define_command } from "../../../core/types/command";

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
	run(context, args) {
		const snowflake = BigInt(args.input);
		const timestamp = DISCORD_EPOCH + (snowflake >> 22n);
		context.respond(`<t:${timestamp / 1000n}> (${timestamp} unix time)`);
	},
});