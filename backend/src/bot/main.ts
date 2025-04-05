import { module_logger } from "../common/logger/index.ts";
import { check_migrations_or_exit } from "../db/migration.ts";
import { connect_listener } from "../db/notification.ts";
import { bot } from "./index.ts";
import { apply_plugins, load_plugins } from "./loader/index.ts";

const logger = module_logger();

await check_migrations_or_exit();

bot.once("ready", async () => {
	logger.info("Loading plugins...");
	load_plugins();
	await apply_plugins();
	logger.info("I'm ready :O");
});

process.on("unhandledRejection", error => {
	logger.error("Unhandled Promise rejection!", error);
});

await connect_listener();
await bot.connect();
