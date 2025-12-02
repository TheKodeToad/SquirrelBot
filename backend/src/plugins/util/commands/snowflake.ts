import { snowflake } from "#plugins/core/public//customOptionTypes.ts";
import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { utilConfigStore } from "#plugins/util/plugin.ts";

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
			(perms) => perms.snowflakeCommand,
		),
	async run(ctx, args) {
		const snowflake = BigInt(args.input);
		const timestamp = DISCORD_EPOCH + (snowflake >> 22n);
		await ctx.respond(
			`${icons.info} **<t:${timestamp / 1000n}>** (${timestamp} unix time)`,
		);
	},
});
