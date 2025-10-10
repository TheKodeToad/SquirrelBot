
export function dateToHMSString(date = new Date): string {
	return (
		date.getHours().toString().padStart(2, "0") + ":" +
		date.getMinutes().toString().padStart(2, "0") + ":" +
		date.getSeconds().toString().padStart(2, "0")
	);
}

export function dateToUnixSecs(date: Date | number = new Date): number {
	const time = typeof date === "number" ? date : date.getTime();

	return Math.floor(time / 1000);
}

// syntax sugar for writing durations or performing duration calculations
// based on parse-duration lengths

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = HOUR * 24;
export const WEEK = DAY * 7;
export const YEAR = DAY * 365.25;
export const MONTH = YEAR / 12;
export const DECADE = YEAR * 10;
export const CENTURY = YEAR * 100;
export const MILLENIUM = YEAR * 1000;

function humanizeDurationSegments(duration: number): string[] {
	const result = [];

	let remainder = duration;

	if (remainder >= YEAR) {
		const years = Math.floor(remainder / YEAR);
		result.push(years + (years === 1 ? " year" : " years"));
		remainder %= YEAR;
	}

	if (remainder >= WEEK) {
		const weeks = Math.floor(remainder / WEEK);
		result.push(weeks + (weeks === 1 ? " week" : " weeks"));
		remainder %= WEEK;
	}

	if (duration >= YEAR)
		return result;

	if (remainder >= DAY) {
		const days = Math.floor(remainder / DAY);
		result.push(days + (days === 1 ? " day" : " days"));
		remainder %= DAY;
	}

	if (duration >= WEEK)
		return result;

	if (remainder >= HOUR) {
		const hours = Math.floor(remainder / HOUR);
		result.push(hours + (hours === 1 ? " hour" : " hours"));
		remainder %= HOUR;
	}

	if (duration >= DAY)
		return result;

	if (remainder >= MINUTE) {
		const minutes = Math.floor(remainder / MINUTE);
		result.push(minutes + (minutes === 1 ? " minute" : " minutes"));
		remainder %= MINUTE;
	}

	if (duration >= HOUR)
		return result;

	if (remainder >= SECOND) {
		const seconds = Math.floor(remainder / SECOND);
		result.push(seconds + (seconds === 1 ? " second" : " seconds"));
		remainder %= SECOND;
	}

	if (result.length === 0)
		result.push(remainder + "ms");

	return result;
}

/** Markdown safe */
export function humanizeDuration(duration: number): string {
	let result = "";
	const segments = humanizeDurationSegments(duration);

	for (const [i, segment] of segments.entries()) {
		if (i !== 0) {
			if (i === segments.length - 1)
				result += " and ";
			else
				result += ", ";
		}

		result += segment;
	}

	return result;
}
