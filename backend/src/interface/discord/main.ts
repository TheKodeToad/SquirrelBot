import { moduleLogger } from "#common/logger/index.ts";
import { CACHE_PATH } from "#environment.ts";
import { onBotInit, onBotPostInit, onBotPreInit } from "#interface/discord/extensionPoints.ts";
import { bot } from "#interface/discord/index.ts";
import { getPluginCount, getPluginIDs, loadPlugins } from "#loader/index.ts";
import { postgres } from "#storage/index.ts";
import { checkMigrationsOrExit } from "#storage/migration.ts";
import { connectChannelListener, disconnectChannelListener } from "#storage/notification.ts";
import { mkdir } from "node:fs/promises";

const logger = moduleLogger();

await mkdir(CACHE_PATH, { recursive: true });

await checkMigrationsOrExit();

bot.once("ready", async () => {
	try {
		logger.debug?.("Ready event received");

		logger.info?.("Starting up plugins");

		await loadPlugins();

		logger.debug?.(`Plugins (${getPluginCount()}):`, [...getPluginIDs()].map(id => "- " + id).join("\n"));

		logger.debug?.("Firing pre-init...");
		await Promise.all(onBotPreInit.contributions.map(listener => listener()));

		logger.debug?.("Firing init...");
		await Promise.all(onBotInit.contributions.map(listener => listener()));

		logger.debug?.("Firing post-init...");
		await Promise.all(onBotPostInit.contributions.map(listener => listener()));

		logger.info?.(`Total plugins: ${getPluginCount()}`);
		logger.info?.("I'm ready :O");
	} catch (error) {
		logger.error?.("Unhandled error during initialization", error);
		process.exit(1);
	}

	process.on("SIGINT", shutDown);
	process.on("SIGTERM", shutDown);
});

bot.on("shardPreReady", id => logger.debug?.(`Shard #${id} received READY packet`));
bot.on("shardReady", id => logger.info?.(`Shard #${id} ready`));
bot.on("shardResume", id => logger.info?.(`Shard #${id} resumed`));
bot.on("shardDisconnect", (error, id) => {
	if (error === undefined)
		logger.info?.(`Shard #${id} disconnected`);
	else
		logger.error?.(`Shard #${id} disconnected with error`, error);
});
bot.on("connect", id => logger.info?.(`Shard #${id} connected`));

bot.on("error", (error, shard) => {
	if (shard !== undefined)
		logger.error?.(`Oceanic error (shard #${shard})`, error);
	else
		logger.error?.("Oceanic error", error);
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
		await postgres.end();
	} catch (error) {
		logger.error?.(`Unhandled error during cleanup; exit will be forced after ${exitingAfter} seconds`, error);
	}
}
