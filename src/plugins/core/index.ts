import { define_plugin } from "../../plugin/types";
import { prefix_listener } from "./prefix_engine";
import { register_slash_commands, slash_listener } from "./slash_engine";

export const core_plugin = define_plugin({
	id: "core",
	listeners: [prefix_listener, slash_listener],
	async apply(client) {
		await register_slash_commands(client);
	}
});
