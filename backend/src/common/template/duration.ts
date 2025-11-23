import { humanizeDuration } from "#common/time.ts";
import { m, type InferView } from "mousetache";

export const DurationView = m.object({
	readable: m.terminal({ noEscape: true }),
	seconds: m.terminal({ noEscape: true }),
	milliseconds: m.terminal({ noEscape: true }),
});
export type DurationView = InferView<typeof DurationView>;

export function makeDurationView(duration: number): DurationView {
	const result = {
		get readable() {
			return humanizeDuration(duration);
		},
		get seconds() {
			return duration / 1000;
		},
		get milliseconds() {
			return duration;
		},

		toString() {
			return this.readable;
		},
	};

	return result;
}
