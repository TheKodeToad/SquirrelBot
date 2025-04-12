import path from "path";
import { fileURLToPath } from "url";
import { getCallSites } from "util";
import { LOG_LEVEL } from "../../environment.ts";
import { LogLevel, logLevelName } from "./level.ts";

// A custom logger because the Node.JS ecosystem is scary
// Logging allowing for lazy evaluation with ?.info etc.

export function moduleLogger(): Logger {
	const scriptName = fileURLToPath(getCallSites()[1]!.scriptName);
	let discriminator = path.relative("src", scriptName);

	if (discriminator.endsWith(".ts"))
		discriminator = discriminator.substring(0, discriminator.lastIndexOf("."));

	return new Logger(discriminator);
}

function logLevelColor(level: LogLevel): string {
	switch (level) {
		case LogLevel.Debug: return "\x1b[32m"; // green
		case LogLevel.Info: return "\x1b[34m"; // blue
		case LogLevel.Warn: return "\x1b[33m"; // yellow
		case LogLevel.Error: return "\x1b[31m"; // red
		case LogLevel.Fatal: return "\x1b[7m\x1b[31m"; // reversed red
	}
}

type LoggerFunction = (message: string, data?: unknown) => void;

export class Logger {
	private discriminator: string;

	constructor(discriminator: string) {
		this.discriminator = discriminator;
	}

	/**
	 * Print a debugging message.
	 * Usage: logger.debug?.("My message") (lazily evaluated).
	 * Extra data can also be passed in to be logged on a new line (recommended for a relavent object or error).
	 *
	 * This should be used for debugging information which is likely to be handy long-term.
	 * Try to avoid excessive usage.
	 * If you just want to see a value use a debugger or console.log - the latter is easy to spot and remove if it is accidentally left over.
	 */
	get debug(): LoggerFunction | undefined { return this.log(LogLevel.Debug); }

	/**
	 * Print an info message.
	 * Usage: logger.debug?.("My message") (lazily evaluated).
	 * Extra data can also be passed in to be logged on a new line (rarely used, only recommended for a summary of info).
	 *
	 * This should be used - rarely - for information which is relevent for the whole bot - mainly startup info.
	 */
	get info(): LoggerFunction | undefined { return this.log(LogLevel.Info); }

	/**
	 * Print a warning message.
	 * Usage: logger.warn?.("My message") (lazily evaluated).
	 * Extra data can also be passed in to be logged on a new line (recommended for errors).
	 *
	 * This should be used for unexpected behavior which does not threaten stability.
	 */
	get warn(): LoggerFunction | undefined { return this.log(LogLevel.Warn); }

	/**
	 * Print an error message.
	 * Usage: logger.error?.("My message") (lazily evaluated).
	 * Extra data can also be passed in to be logged on a new line (recommended for errors).
	 *
	 * This should be used for unexpected errors which potentially could be more serious.
	 */
	get error(): LoggerFunction | undefined { return this.log(LogLevel.Error); }

	/**
	 * Print a fatal error message.
	 * Usage: logger.fatal?.("My message") (lazily evaluated).
	 * Extra data can also be passed in to be logged on a new line (recommended for errors).
	 *
	 * This should be used very rarely for critical errors.
	 */
	get fatal(): LoggerFunction | undefined { return this.log(LogLevel.Fatal); }

	log(level: LogLevel): LoggerFunction | undefined {
		if (LOG_LEVEL > level)
			return undefined;

		return (message, data) => {
			const now = new Date;
			const time =
				now.getHours().toString().padStart(2, "0") + ":" +
				now.getMinutes().toString().padStart(2, "0") + ":" +
				now.getSeconds().toString().padStart(2, "0");

			// you mean you DON'T know ansi escape codes off by heart
			// too bad!
			console.error(`\x1b[2m${time} \x1b[0m${logLevelColor(level)}${logLevelName(level)}:\x1b[0m ${message} \x1b[2m(${this.discriminator})\x1b[0m`);

			if (data !== undefined) {
				console.group();
				console.error(data);
				console.groupEnd();
			}
		};
	}
}
