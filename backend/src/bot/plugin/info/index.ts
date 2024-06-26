import { define_plugin } from "../../core/types/plugin";
import { ping_command } from "./command/ping";

export const info_plugin = define_plugin({
	id: "info",
	commands: [ping_command]
});