import { z } from "zod";

export const enum NumberFilterMode {
	Equals,
	NotEquals,
	LessThan,
	LessThanOrEqual,
	GreaterThan,
	GreaterThanOrEqual,
}

export const NumberFilter = z.string().transform((input, ctx) => {
	let numberString = input;
	let mode = NumberFilterMode.Equals;

	if (numberString.startsWith("=")) {
		numberString = numberString.substring(1);
	} else if (numberString.startsWith("!=")) {
		mode = NumberFilterMode.NotEquals;
		numberString = numberString.substring(2);
	} else if (numberString.startsWith("<=")) {
		mode = NumberFilterMode.LessThanOrEqual;
		numberString = numberString.substring(2);
	} else if (numberString.startsWith("<")) {
		mode = NumberFilterMode.LessThan;
		numberString = numberString.substring(1);
	} else if (numberString.startsWith(">=")) {
		mode = NumberFilterMode.GreaterThanOrEqual;
		numberString = numberString.substring(2);
	} else if (numberString.startsWith(">")) {
		mode = NumberFilterMode.GreaterThan;
		numberString = numberString.substring(1);
	}

	const number = parseInt(numberString, 10); // no hex cos it looks weird :>

	if (Number.isNaN(number)) {
		ctx.addIssue(
			"Invalid value: Expected comparison operator (=, !=, >, >=, <, <=) followed by a number, but received " +
				input,
		);
		return z.NEVER;
	}

	return { number, mode };
});

export interface NumberFilter extends z.output<typeof NumberFilter> {}
