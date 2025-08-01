import { dateToUnixSeconds } from "#common/time.ts";

export const enum TimestampPresentation {
	DateTime,
	DateTimeLong,
	Time,
	TimeLong,
	Date,
	DateLong,
	Relative,
	Unix,
	UnixSeconds,
}

export function formatTimestampParam(timestamp: Date, present: TimestampPresentation): string {
	switch (present) {
	case TimestampPresentation.DateTime:
		return `<t:${dateToUnixSeconds(timestamp)}:f>`;
	case TimestampPresentation.DateTimeLong:
		return `<t:${dateToUnixSeconds(timestamp)}:F>`;
	case TimestampPresentation.Time:
		return `<t:${dateToUnixSeconds(timestamp)}:t>`;
	case TimestampPresentation.TimeLong:
		return `<t:${dateToUnixSeconds(timestamp)}:T>`;
	case TimestampPresentation.Date:
		return `<t:${dateToUnixSeconds(timestamp)}:d>`;
	case TimestampPresentation.DateLong:
		return `<t:${dateToUnixSeconds(timestamp)}:D>`;
	case TimestampPresentation.Relative:
		return `<t:${dateToUnixSeconds(timestamp)}:R>`;
	case TimestampPresentation.Unix:
		return timestamp.getTime().toString();
	case TimestampPresentation.UnixSeconds:
		return dateToUnixSeconds(timestamp).toString();
	}
}

export function parseTimestampPresentation(input: string | undefined): TimestampPresentation | null {
	switch (input) {
	case "date_time":
	case "f":
	case undefined:
		return TimestampPresentation.DateTime;

	case "date_time_long":
	case "F":
		return TimestampPresentation.DateTimeLong;

	case "time":
	case "t":
		return TimestampPresentation.Time;

	case "time_long":
	case "T":
		return TimestampPresentation.TimeLong;

	case "date":
	case "d":
		return TimestampPresentation.Date;

	case "date_long":
	case "D":
		return TimestampPresentation.DateLong;

	case "relative":
	case "r":
	case "R":
		return TimestampPresentation.Relative;

	case "unix":
		return TimestampPresentation.Unix;

	case "unix_seconds":
		return TimestampPresentation.UnixSeconds;

	default:
		return null;
	}
}
