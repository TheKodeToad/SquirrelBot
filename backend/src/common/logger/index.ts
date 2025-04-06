import path from "path";
import { fileURLToPath } from "url";
import { getCallSites } from "util";
import { LOG_LEVEL } from "../../environment.ts";
import { log_level_colour as level_color, LogLevel } from "./level.ts";

// A custom logger because the Node.JS ecosystem is scary

export function module_logger(): Logger {
	const script_name = fileURLToPath(getCallSites()[1]!.scriptName);
	let discriminator = path.relative("src", script_name);

	if (discriminator.endsWith(".ts"))
		discriminator = discriminator.substring(0, discriminator.lastIndexOf("."));

	return new Logger(discriminator);
}

type Message = string | (() => string);

export class Logger {
	private discriminator: string;

	constructor(discriminator: string) {
		this.discriminator = discriminator;
	}

	debug(message: Message, data?: unknown) {
		this.log(LogLevel.Debug, message, data);
	}

	info(message: Message, data?: unknown) {
		this.log(LogLevel.Info, message, data);
	}

	warn(message: Message, data?: unknown) {
		this.log(LogLevel.Warn, message, data);
	}

	error(message: Message, data?: unknown) {
		this.log(LogLevel.Error, message, data);
	}

	fatal(message: Message, data?: unknown) {
		this.log(LogLevel.Fatal, message, data);
	}

	log(level: LogLevel, message: Message, data?: unknown) {
		if (LOG_LEVEL > level)
			return;

		const now = new Date;
		const time =
			now.getHours().toString().padStart(2, "0") + ":" +
			now.getMinutes().toString().padStart(2, "0") + ":" +
			now.getSeconds().toString().padStart(2, "0");

		// TODO: probably not secure enough
		if (typeof message === "function")
			message = message();

		let formatted_message = `\x1b[2m${time} \x1b[0m${level_color(level)}${LogLevel[level]}:\x1b[0m ${message} \x1b[2m(${this.discriminator})\x1b[0m`;

		console.error(formatted_message);

		if (data !== undefined) {
			console.group();
			console.error(data);
			console.groupEnd();
		}
	}
}
