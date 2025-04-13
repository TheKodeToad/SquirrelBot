export const enum LogLevel {
	Debug,
	Info,
	Warn,
	Error,
	Fatal,
}

export function logLevelByName(name: string): LogLevel | undefined {
	switch (name) {
		case "debug": return LogLevel.Debug;
		case "info": return LogLevel.Info;
		case "warn": return LogLevel.Warn;
		case "error": return LogLevel.Error;
		case "fatal": return LogLevel.Fatal;
		default: return undefined;
	}
}

export function logLevelName(level: LogLevel): string {
	switch (level) {
		case LogLevel.Debug: return "debug";
		case LogLevel.Info: return "info";
		case LogLevel.Warn: return "warn";
		case LogLevel.Error: return "error";
		case LogLevel.Fatal: return "fatal";
	}
}