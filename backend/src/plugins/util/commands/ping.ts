import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import { icons } from "#plugins/core/public/icons.ts";
import { utilConfigStore } from "#plugins/util/index.ts";

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
