import { define_command } from "../../../core/types/command";

export const ping_command = define_command({
	id: "ping",
	track_updates: true, // allow deleting
	async run(context) {
		const base_response = `:information: Gateway: ${context.shard.latency}ms`;
		const pre_respond = Date.now();

		await context.respond(base_response);
		await context.respond(base_response + `; REST: ${Date.now() - pre_respond}ms`);
	},
});