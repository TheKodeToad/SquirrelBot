import { moduleLogger } from "#common/logger/index.ts";
import { onBotInit } from "#discord/extensionPoints.ts";
import { BOT_TOKEN, CACHE_PATH } from "#environment.ts";
import { createContext, shutdownContext } from "#loader/index.ts";
import { preMain, setupGracefulShutdown } from "#setup.ts";
import { mkdir } from "node:fs/promises";
import { Client, Constants } from "oceanic.js";

preMain();

const logger = moduleLogger();
const loaderCtx = await createContext();

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
const ctx = { ...loaderCtx, bot };

await mkdir(CACHE_PATH, { recursive: true });

bot.once("ready", async () => {
	try {
		logger.debug?.("Ready event received");

		logger.debug?.("Firing onBotInit");
		await onBotInit.fire(ctx);

		logger.info?.("I'm ready :O");
	} catch (error) {
		logger.error?.("Unhandled error during initialization", error);
		process.exit(1);
	}

	setupGracefulShutdown(async () => {
		bot.disconnect(false);
		shutdownContext(ctx);
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

logger.info?.("Connecting to Discord");
await bot.connect();
