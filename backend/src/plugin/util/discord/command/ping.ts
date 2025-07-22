import { defineCommand } from "#plugin/core/discord/public/extensionPoints.ts";
import { permissionsGuard } from "#plugin/core/discord/public/helper/commandGuards.ts";
import { icons } from "#plugin/core/discord/public/icons.ts";
import { utilConfigStore } from "#plugin/util/index.ts";

export default defineCommand({
	name: ["ping"],
	description: "Pong!",

	trackUpdates: true, // allow deleting

	preRun: context => permissionsGuard(context, utilConfigStore, permissions => permissions.ping_command),
	async run(context) {
		const baseResponse = `${icons.info} **Gateway:** ${context.shard.latency}ms`;
		const preRespond = Date.now();
		await context.respond(baseResponse);
		await context.respond(baseResponse + `; **REST:** ${Date.now() - preRespond}ms`);
	},
});
