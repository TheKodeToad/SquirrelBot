import path from "path";
import { fileURLToPath } from "url";
import { getCallSites } from "util";
import { LOG_LEVEL } from "../../environment.ts";

export enum LogLevel {
	DEBUG,
	INFO,
	WARN,
	ERROR,
	FATAL
}

const level_names = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
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

export function module_logger() {
	const script_name = fileURLToPath(getCallSites()[1]!.scriptName);
	let discriminator = path.relative("src", script_name);

	if (discriminator.endsWith(".ts"))
		discriminator = discriminator.substring(0, discriminator.lastIndexOf("."));

	return new Logger(discriminator);
}

export class Logger {
	private discriminator: string;

	constructor(discriminator: string) {
		this.discriminator = discriminator;
	}

	info(message: string, error?: Error) {
		this.log(LogLevel.INFO, message, error);
	}

	log(level: LogLevel, message: string, error?: Error) {
		if (PARSED_LOG_LEVEL > level)
			return;

		const now = new Date;
		const time =
			now.getHours().toString().padStart(2, "0") + ":" +
			now.getMinutes().toString().padStart(2, "0") + ":" +
			now.getSeconds().toString().padStart(2, "0");

		let formatted_message = `\x1b[2m${time} ${this.discriminator} \x1b[0m${level_colors[level]}${level_names[level]}:\x1b[0m ${message}`;

		if (error !== undefined)
			formatted_message += "\n" + error;

		console.error(formatted_message);
	}
}
