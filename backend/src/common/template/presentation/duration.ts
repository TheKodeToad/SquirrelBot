import { humanizeDuration } from "#common/time.ts";

export const enum DurationPresentation {
	Readable,
	Seconds,
	Milliseconds,
}

export function parseDurationPresentation(input: string | undefined): DurationPresentation | null {
	switch (input) {
	case "readable":
	case undefined:
		return DurationPresentation.Readable;
	case "seconds":
		return DurationPresentation.Seconds;
	case "milliseconds":
		return DurationPresentation.Milliseconds;
	default:
		return null;
	}
}

export function formatDurationParam(duration: number, presentation: DurationPresentation): string {
	switch (presentation) {
	case DurationPresentation.Readable:
		return humanizeDuration(duration);
	case DurationPresentation.Milliseconds:
		return duration.toString();
	case DurationPresentation.Seconds:
		return Math.floor(duration / 1000).toString();
	}
}
