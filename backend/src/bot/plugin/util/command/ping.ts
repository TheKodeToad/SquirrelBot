import { defineCommand } from "../../core/public/command.ts";
import { permissionsGuard } from "../../core/public/helper/commandGuards.ts";
import { icons } from "../../core/public/icons.ts";
import { utilConfig } from "../index.ts";

export const pingCommand = defineCommand({
	name: ["ping"],
	trackUpdates: true, // allow deleting

	preRun: context => permissionsGuard(context, utilConfig, permissions => permissions.ping_command),
	async run(context) {
		const baseResponse = `${icons.info} Gateway: ${context.shard.latency}ms`;
		const preRespond = Date.now();
		await context.respond(baseResponse);
		await context.respond(baseResponse + `; REST: ${Date.now() - preRespond}ms`);
	},
});
