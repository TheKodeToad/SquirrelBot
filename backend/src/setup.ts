import type { Awaitable } from "#common/general.ts";
import { moduleLogger } from "#common/logger/index.ts";
import { checkMigrationsOrExit } from "#storage/migration.ts";

const logger = moduleLogger();

/**
 * Common pre-startup code.
 */
export async function preMain(): Promise<void> {
	// not sure if this is good practice but we certainly don't want a crash because we forgot await
	process.on("unhandledRejection", error => {
		logger.error?.("Unhandled Promise rejection!", error);
	});

	if (hasProto())
		logger.warn?.("The app is tested with --disable-proto=throw. Running without this option is unnecessary and not recommended!");

	Object.freeze(Object.prototype);
	Object.freeze(Array.prototype);

	await checkMigrationsOrExit();
}

function hasProto(): boolean {
	const foo = {};
	try {
		// @ts-expect-error deliberate access of legacy prop
		return foo.__proto__ != null;
	} catch {
		return false;
	}
}

export function setupGracefulShutdown(callback: () => Awaitable<void>): void {
	let exitingAfter = 0;

	const shutDown = async (signal: NodeJS.Signals): Promise<void> => {
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
			await callback();
		} catch (error) {
			logger.error?.(`Unhandled error during cleanup; exit will be forced after ${exitingAfter} seconds`, error);
		}
	};

	process.on("SIGINT", shutDown);
	process.on("SIGTERM", shutDown);
}
