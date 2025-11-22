import type { Awaitable } from "#common/general.ts";
import { moduleLogger } from "#common/logger/index.ts";

const logger = moduleLogger();

export function setupShutdownHook(callback: () => Awaitable<void>): void {
	let exitingAfter = 0;

	const shutDown = async (signal: NodeJS.Signals): Promise<void> => {
		if (exitingAfter !== 0) {
			logger.warn?.(`Already attempting shutdown - exit will be forced after ${exitingAfter} seconds`);
			return;
		}

		logger.info?.(`Received ${signal}; attempting graceful shutdown`);

		if (signal === "SIGTERM") {
			exitingAfter = 30;
		} else {
			exitingAfter = 5;
		}

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
