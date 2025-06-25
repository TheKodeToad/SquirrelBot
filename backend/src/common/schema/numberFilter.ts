import type { InferOutput } from "valibot";
import { pipe, rawTransform, string } from "valibot";

export const enum NumberFilterMode {
	Equals,
	NotEquals,
	LessThan,
	LessThanOrEqual,
	GreaterThan,
	GreaterThanOrEqual,
}

export const NumberFilter = pipe(
	string(),
	rawTransform(({ dataset, addIssue, NEVER }) => {
		if (!dataset.typed)
			return NEVER;

		let numberString = dataset.value;
		let mode = NumberFilterMode.Equals;

		if (numberString.startsWith("="))
			numberString = numberString.substring(1);
		else if (numberString.startsWith("!=")) {
			mode = NumberFilterMode.NotEquals;
			numberString = numberString.substring(2);
		} else if (numberString.startsWith("<")) {
			mode = NumberFilterMode.LessThan;
			numberString = numberString.substring(1);
		} else if (numberString.startsWith("<=")) {
			mode = NumberFilterMode.LessThanOrEqual;
			numberString = numberString.substring(2);
		} else if (numberString.startsWith(">")) {
			mode = NumberFilterMode.GreaterThan;
			numberString = numberString.substring(1);
		} else if (numberString.startsWith(">=")) {
			mode = NumberFilterMode.GreaterThanOrEqual;
			numberString = numberString.substring(2);
		}

		const number = parseInt(numberString, 10); // no hex cos it looks weird :>

		if (Number.isNaN(number)) {
			addIssue({ message: "Invalid value: Expected comparison operator (=, !=, >, >=, <, <=) followed by a number, but received " + dataset.value });
			return NEVER;
		}

		return { number, mode };
	})
);
export interface NumberFilter extends InferOutput<typeof NumberFilter> { }
