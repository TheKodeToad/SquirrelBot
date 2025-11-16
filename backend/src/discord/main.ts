import { moduleLogger } from "#common/logger/index.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import { bot } from "#discord/index.ts";
import { DATA_PATH } from "#environment.ts";
import { loadPlugins } from "#loader/index.ts";
import { preMain, setupGracefulShutdown } from "#setup.ts";
import { sqlite } from "#storage/index.ts";
import { mkdir } from "node:fs/promises";

await preMain();

const logger = moduleLogger();

await mkdir(DATA_PATH, { recursive: true });

bot.once("ready", async () => {
	try {
		logger.debug?.("Ready event received");

		logger.info?.("Starting up plugins");

		await loadPlugins();

		logger.debug?.("Firing onBotInit");
		await onBotInit.fire();

		logger.info?.("I'm ready :O");
	} catch (error) {
		logger.error?.("Unhandled error during initialization", error);
		process.exit(1);
	}

	setupGracefulShutdown(async () => {
		bot.disconnect(false);

		//disconnectChannelListener();
		sqlite.close();
	});
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
	if (shard !== undefined)
		logger.warn?.(`Oceanic warning (shard #${shard}): ${info}`);
	else
		logger.warn?.(`Oceanic warning: ${info}`);
});

logger.info?.("Connecting Postgres listener");
//await connectChannelListener();

logger.info?.("Connecting to Discord");
await bot.connect();
