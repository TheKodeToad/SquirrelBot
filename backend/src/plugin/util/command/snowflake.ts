import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { snowflake } from "#plugin/core/public/helper/customOptionTypes.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { utilConfigStore } from "#plugin/util/index.ts";

const DISCORD_EPOCH = BigInt(new Date(2015, 0, 1).getTime());

export default defineCommand({
	name: ["snowflake", "snowflakeinfo", "creation"],
	description:
		"Calculate the creation date of something on Discord based on its ID.",

	trackUpdates: true,
	options: {
		input: {
			type: snowflake,
			description: "The Discord ID of a channel, user or something else.",
			name: ["input", "i"],
			required: true,
			position: 0,
		},
	},

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			utilConfigStore,
			(permissions) => permissions.snowflakeCommand,
		),
	async run(ctx, args) {
		const snowflake = BigInt(args.input);
		const timestamp = DISCORD_EPOCH + (snowflake >> 22n);
		await ctx.respond(
			`${icons.info} **<t:${timestamp / 1000n}>** (${timestamp} unix time)`,
		);
	},
});
