import { check_migrations_or_exit } from "../db/migration.ts";
import { connect_listener } from "../db/notification.ts";
import { bot } from "./index.ts";
import { apply_plugins, load_plugins } from "./loader/index.ts";

await check_migrations_or_exit();

bot.once("ready", async () => {
	console.log("Loading plugins...");
	load_plugins();
	await apply_plugins();
	console.log("I'm ready :O");
});

await connect_listener();
await bot.connect();
