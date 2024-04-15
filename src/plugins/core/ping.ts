import { Shard } from "oceanic.js";
import { define_command } from "../../plugin/types";

export const ping_command = define_command({
	id: "ping",
	async run(context) {
		if (!context.guild)
			return;

		const pre_respond = Date.now();
		await context.respond("...");

		const rest_ping = Date.now() - pre_respond;
		const shard: Shard = context.guild!.shard;

		await context.respond(`REST: ${rest_ping}ms\nGateway: ${shard.latency}ms`);
	},
});