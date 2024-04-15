import { define_plugin } from "../../plugin/types";
import { ping_command } from "./ping";
import { prefix_listener } from "./prefix_engine";
import { register_slash_commands, slash_listener } from "./slash_engine";

export const core_plugin = define_plugin({
	id: "core",
	listeners: [prefix_listener, slash_listener],
	commands: [ping_command],
	async apply(client) {
		await register_slash_commands(client);
	}
});
