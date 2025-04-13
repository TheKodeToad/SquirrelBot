import { moduleLogger } from "../common/logger/index.ts";
import { checkMigrationsOrExit } from "../db/migration.ts";
import { connectListener } from "../db/notification.ts";
import { bot } from "./index.ts";
import { applyPlugins, countPlugins, loadPlugins } from "./loader/index.ts";

const logger = moduleLogger();

await checkMigrationsOrExit();

bot.once("ready", async () => {
	logger.debug?.("Ready event received");

	logger.info?.("Starting up plugins");
	loadPlugins();
	await applyPlugins();
	logger.info?.(`Total plugins: ${countPlugins()}`);
	logger.info?.("I'm ready :O");
});

bot.on("error", (error, shard) => {
	if (shard !== undefined)
		logger.error?.(`Oceanic emitted error in shard #${shard}`, error);
	else
		logger.error?.("Oceanic emitted error", error);
});

process.on("unhandledRejection", error => {
	logger.error?.("Unhandled Promise rejection!", error);
});

logger.info?.("Connecting Postgres listener");
await connectListener();
logger.info?.("Connecting to Discord");
await bot.connect();
