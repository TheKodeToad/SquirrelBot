import { LogLevel, module_logger as logger_for_this_module } from "../common/logger/index.ts";
import { check_migrations_or_exit } from "../db/migration.ts";
import { connect_listener } from "../db/notification.ts";
import { bot } from "./index.ts";
import { apply_plugins, load_plugins } from "./loader/index.ts";

const logger = logger_for_this_module();

logger.log(LogLevel.FATAL, "Oh no");

await check_migrations_or_exit();

bot.once("ready", async () => {
	logger.info("Loading plugins...");
	load_plugins();
	await apply_plugins();
	logger.info("I'm ready :O");
});

process.on("unhandledRejection", error => {
	console.error("Unhandled rejection:");
	console.error(error);
});

await connect_listener();
await bot.connect();
