import { permissions_guard } from "../../core/public/command/helper.ts";
import { define_command } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { util_config } from "../index.ts";

export const ping_command = define_command({
	id: "ping",
	track_updates: true, // allow deleting

	pre_run: context => permissions_guard(context, util_config, permissions => permissions.ping_command),
	async run(context) {
		const base_response = `${icons.info} Gateway: ${context.shard.latency}ms`;
		const pre_respond = Date.now();
		await context.respond(base_response);
		await context.respond(base_response + `; REST: ${Date.now() - pre_respond}ms`);
	},
});
