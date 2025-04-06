export enum LogLevel {
	Debug,
	Info,
	Warn,
	Error,
	Fatal,
}

const level_colors: Record<LogLevel, string> & string[] = [
	// debug: green
	"\x1b[32m",
	// info: blue
	"\x1b[34m",
	// warn: yellow
	"\x1b[33m",
	// error: red
	"\x1b[31m",
	// fatal: reversed red
	"\x1b[7m\x1b[31m"
];

export function log_level_colour(level: LogLevel) {
	return level_colors[level];
}

export function parse_level(name: string): LogLevel | undefined {
	if (!Object.hasOwn(LogLevel, name))
		return undefined;

	return LogLevel[name as keyof typeof LogLevel];
}
