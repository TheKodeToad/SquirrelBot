import { dateToUnixSecs } from "#common/time.ts";
import { m, type InferView } from "mousetache";

export const TimestampView = m.object(
	{
		dateTime: m.terminal({ noEscape: true }),
		dateTimeLong: m.terminal({ noEscape: true }),
		time: m.terminal({ noEscape: true }),
		timeLong: m.terminal({ noEscape: true }),
		date: m.terminal({ noEscape: true }),
		dateLong: m.terminal({ noEscape: true }),
		relative: m.terminal({ noEscape: true }),
		unix: m.terminal({ noEscape: true }),
		unixSecs: m.terminal({ noEscape: true }),
	},
	{ noEscape: true },
);
export type TimestampView = InferView<typeof TimestampView>;

export function makeTimestampView(date: Date): TimestampView {
	const result = {
		get dateTime() {
			return `<t:${this.unixSecs}:f>`;
		},
		get dateTimeLong() {
			return `<t:${this.unixSecs}:F>`;
		},
		get time() {
			return `<t:${this.unixSecs}:t>`;
		},
		get timeLong() {
			return `<t:${this.unixSecs}:T>`;
		},
		get date() {
			return `<t:${this.unixSecs}:d>`;
		},
		get dateLong() {
			return `<t:${this.unixSecs}:D>`;
		},
		get relative() {
			return `<t:${this.unixSecs}:r>`;
		},
		get unix() {
			return date.getTime();
		},
		get unixSecs() {
			return dateToUnixSecs(date);
		},

		toString() {
			return this.dateTime;
		},
	};

	return result;
}
