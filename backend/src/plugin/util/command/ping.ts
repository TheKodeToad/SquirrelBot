import { defineCommand } from "#plugin/core/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/public/icons.ts";
import { utilConfigStore } from "#plugin/util/index.ts";

export default defineCommand({
	name: ["ping"],
	description: "Pong!",

	trackUpdates: true, // allow deleting

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			utilConfigStore,
			(permissions) => permissions.pingCommand,
		),
	async run(ctx) {
		const baseResponse = `${icons.info} **Gateway:** ${ctx.shard.latency}ms`;
		const preRespond = Date.now();
		await ctx.respond(baseResponse);
		await ctx.respond(
			baseResponse + `; **REST:** ${Date.now() - preRespond}ms`,
		);
	},
});
