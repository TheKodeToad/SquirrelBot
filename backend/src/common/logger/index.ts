import path from "path";
import { fileURLToPath } from "url";
import { getCallSites } from "util";
import { LOG_LEVEL } from "../../environment.ts";

// A custom logger because the Node.JS ecosystem is scary

export function module_logger(): Logger {
	const script_name = fileURLToPath(getCallSites()[1]!.scriptName);
	let discriminator = path.relative("src", script_name);

	if (discriminator.endsWith(".ts"))
		discriminator = discriminator.substring(0, discriminator.lastIndexOf("."));

	return new Logger(discriminator);
}

export enum LogLevel {
	DEBUG,
	INFO,
	WARN,
	ERROR,
	FATAL
}

const level_names = ["debug", "info", "warn", "error", "fatal"];
const level_colors = [
	// DEBUG: green
	"\x1b[32m",
	// INFO: blue
	"\x1b[34m",
	// WARN: yellow
	"\x1b[33m",
	// ERROR: red
	"\x1b[31m",
	// DISASTER: reversed red
	"\x1b[7m\x1b[31m"
];

const PARSED_LOG_LEVEL = level_names.indexOf(LOG_LEVEL);

type Message = string | (() => string);

export class Logger {
	private discriminator: string;

	constructor(discriminator: string) {
		this.discriminator = discriminator;
	}

	debug(message: Message, data?: unknown) {
		this.log(LogLevel.DEBUG, message, data);
	}

	info(message: Message, data?: unknown) {
		this.log(LogLevel.INFO, message, data);
	}

	warn(message: Message, data?: unknown) {
		this.log(LogLevel.WARN, message, data);
	}

	error(message: Message, data?: unknown) {
		this.log(LogLevel.ERROR, message, data);
	}

	fatal(message: Message, data?: unknown) {
		this.log(LogLevel.FATAL, message, data);
	}

	log(level: LogLevel, message: Message, data?: unknown) {
		if (PARSED_LOG_LEVEL > level)
			return;

		const now = new Date;
		const time =
			now.getHours().toString().padStart(2, "0") + ":" +
			now.getMinutes().toString().padStart(2, "0") + ":" +
			now.getSeconds().toString().padStart(2, "0");

		// TODO: probably not secure enough
		if (typeof message === "function")
			message = message();

		let formatted_message = `\x1b[2m${time} \x1b[0m${level_colors[level]}${level_names[level]}:\x1b[0m ${message} \x1b[2m(${this.discriminator})\x1b[0m`;

		console.error(formatted_message);

		if (data !== undefined) {
			console.group();
			console.error(data);
			console.groupEnd();
		}
	}
}
