import { mkdir } from "fs/promises";
import { moduleLogger } from "../common/logger/index.ts";
import { pool } from "../db/index.ts";
import { checkMigrationsOrExit } from "../db/migration.ts";
import { connectChannelListener, disconnectChannelListener } from "../db/notification.ts";
import { CACHE_PATH } from "../environment.ts";
import { bot } from "./index.ts";
import { applyPlugins, countPlugins, loadPlugins } from "./loader/index.ts";

const logger = moduleLogger();

await mkdir(CACHE_PATH, { recursive: true });

await checkMigrationsOrExit();

bot.once("ready", async () => {
	try {
		logger.debug?.("Ready event received");

		logger.info?.("Starting up plugins");
		loadPlugins();
		await applyPlugins();
		logger.info?.(`Total plugins: ${countPlugins()}`);
		logger.info?.("I'm ready :O");
	} catch (error) {
		logger.error?.("Unhandled error during initialization", error);
		process.exit(1);
	}

	process.on("SIGINT", shutDown);
	process.on("SIGTERM", shutDown);
});

bot.on("error", (error, shard) => {
	if (shard !== undefined)
		logger.error?.(`Oceanic emitted error in shard #${shard}`, error);
	else
		logger.error?.("Oceanic emitted error", error);
});

bot.on("warn", (info, shard) => {
	if (shard !== undefined) {
		logger.warn?.(`Oceanic warning (shard #${shard}): ${info}`);
	} else {
		logger.warn?.(`Oceanic warning: ${info}`);
	}
});

process.on("unhandledRejection", error => {
	logger.error?.("Unhandled Promise rejection!", error);
});

logger.info?.("Connecting Postgres listener");
await connectChannelListener();
logger.info?.("Connecting to Discord");
await bot.connect();

let exitingAfter = 0;

async function shutDown(signal: NodeJS.Signals): Promise<void> {
	if (exitingAfter !== 0) {
		logger.warn?.(`Already attempting shutdown - exit will be forced after ${exitingAfter} seconds`);
		return;
	}

	logger.info?.(`Received ${signal}; attempting graceful shutdown`);

	if (signal === "SIGTERM")
		exitingAfter = 30;
	else
		exitingAfter = 5;

	setTimeout(() => {
		logger.warn?.(`Forced exit after waiting for ${exitingAfter} seconds`);
		process.exit(1);
	}, exitingAfter * 1000).unref();

	try {
		bot.disconnect(false);

		disconnectChannelListener();
		await pool.end();
	} catch (error) {
		logger.error?.(`Unhandled error during cleanup; exit will be forced after ${exitingAfter} seconds`, error);
	}
}
