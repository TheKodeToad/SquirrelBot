import { define_command } from "../../../core/types/command";

export const ping_command = define_command({
	id: "ping",
	async run(context) {
		if (!context.guild)
			return;

		const pre_respond = Date.now();
		await context.respond("...");

		const rest_ping = Date.now() - pre_respond;
		const shard = context.guild!.shard;

		await context.respond(`:information: REST: ${rest_ping}ms, Gateway: ${shard.latency}ms`);
	},
});