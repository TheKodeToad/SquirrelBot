import { check_migrations, migrate } from "../db/migration.ts";
import { connect_listener } from "../db/notification.ts";
import { DB_AUTO_MIGRATE } from "../environment.ts";
import { bot } from "./index.ts";
import { core_plugin } from "./plugin/core/index.ts";
import { moderation_plugin } from "./plugin/moderation/index.ts";
import { util_plugin } from "./plugin/util/index.ts";
import { apply_plugins, register_plugin } from "./plugin_registry.ts";

bot.once("ready", async () => {
	console.log("Loading plugins...");

	register_plugin(core_plugin);
	register_plugin(moderation_plugin);
	register_plugin(util_plugin);
	await apply_plugins();

	console.log("I'm ready :O");
});

if (DB_AUTO_MIGRATE)
	await migrate();
else {
	const migrations_needed = await check_migrations();

	if (migrations_needed > 0) {
		console.error(`${migrations_needed} migrations needed!`);
		console.error("Run pnpm migrate or set DB_AUTO_MIGRATE=true in env!");
		console.error("Note: this cannot be reversed! Backups are *your* responsibility!");
		process.exit(1);
	}
}

await connect_listener();
await bot.connect();
