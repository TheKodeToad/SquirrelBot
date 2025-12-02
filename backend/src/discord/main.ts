import { backendInit, backendShutdown } from "#backend.ts";
import { moduleLogger } from "#common/logger/logger.ts";
import { setupShutdownHook } from "#common/shutdownHook.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import { BOT_TOKEN, CACHE_PATH } from "#environment.ts";
import { mkdir } from "node:fs/promises";
import { Client, Constants } from "oceanic.js";

const baseCtx = await backendInit();
await mkdir(CACHE_PATH, { recursive: true });

const logger = moduleLogger();

const bot = new Client({
	auth: `Bot ${BOT_TOKEN}`,
	gateway: {
		intents:
			Constants.AllNonPrivilegedIntents
			| Constants.Intents.MESSAGE_CONTENT
			| Constants.Intents.GUILD_MEMBERS,
		lookupDisallowedIntents: true,
	},

	allowedMentions: {},
});

const ctx = { ...baseCtx, bot };

bot.once("ready", async () => {
	try {
		logger.debug?.("Ready event received");

		setupShutdownHook(async () => {
			bot.disconnect(false);
			await backendShutdown(ctx);
		});

		logger.debug?.("Firing onBotInit");
		await onBotInit.fire(ctx);

		logger.info?.("I'm ready :O");
	} catch (error) {
		logger.error?.("Unhandled error during initialization", error);
		process.exit(1);
	}
});

bot.on("shardPreReady", (id) =>
	logger.debug?.(`Shard #${id} received READY packet`),
);
bot.on("shardReady", (id) => logger.info?.(`Shard #${id} ready`));
bot.on("shardResume", (id) => logger.info?.(`Shard #${id} resumed`));
bot.on("shardDisconnect", (error, id) => {
	if (error === undefined) {
		logger.info?.(`Shard #${id} disconnected`);
	} else {
		logger.error?.(`Shard #${id} disconnected with error`, error);
	}
});
bot.on("connect", (id) => logger.info?.(`Shard #${id} connected`));

bot.on("error", (error, shard) => {
	if (shard !== undefined) {
		logger.error?.(`Oceanic error (shard #${shard})`, error);
	} else {
		logger.error?.("Oceanic error", error);
	}
});

bot.on("warn", (info, shard) => {
	if (shard !== undefined) {
		logger.warn?.(`Oceanic warning (shard #${shard}): ${info}`);
	} else {
		logger.warn?.(`Oceanic warning: ${info}`);
	}
});

logger.info?.("Connecting to Discord");
await bot.connect();
