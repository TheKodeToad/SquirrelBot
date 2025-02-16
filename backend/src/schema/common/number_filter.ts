import type { InferOutput } from "valibot";
import { pipe, rawTransform, string } from "valibot";

export enum NumberFilterMode {
	EQUALS,
	NOT_EQUALS,
	LESS_THAN,
	LESS_THAN_OR_EQUAL,
	GREATER_THAN,
	GREATER_THAN_OR_EQUAL,
}

export const number_filter_schema = pipe(
	string(),
	rawTransform(({ dataset, addIssue, NEVER }) => {
		if (!dataset.typed)
			return NEVER;

		let number_string = dataset.value;
		let mode = NumberFilterMode.EQUALS;

		if (number_string.startsWith("="))
			number_string = number_string.substring(1);
		else if (number_string.startsWith("!=")) {
			mode = NumberFilterMode.NOT_EQUALS;
			number_string = number_string.substring(2);
		} else if (number_string.startsWith("<")) {
			mode = NumberFilterMode.LESS_THAN;
			number_string = number_string.substring(1);
		} else if (number_string.startsWith("<=")) {
			mode = NumberFilterMode.LESS_THAN_OR_EQUAL;
			number_string = number_string.substring(2);
		} else if (number_string.startsWith(">")) {
			mode = NumberFilterMode.GREATER_THAN;
			number_string = number_string.substring(1);
		} else if (number_string.startsWith(">=")) {
			mode = NumberFilterMode.GREATER_THAN_OR_EQUAL;
			number_string = number_string.substring(2);
		}

		const number = parseInt(number_string, 10); // no hex cos it looks weird :>

		if (Number.isNaN(number)) {
			addIssue({ message: "Invalid value: Expected comparison operator (=, !=, >, >=, <, <=) followed by a number, but received " + dataset.value });
			return NEVER;
		}

		return { number, mode };
	})
);
export interface NumberFilter extends InferOutput<typeof number_filter_schema> { }

export function test_number_filter(filter: NumberFilter, number: number): boolean {
	switch (filter.mode) {
		case NumberFilterMode.EQUALS:
			return number === filter.number;
		case NumberFilterMode.NOT_EQUALS:
			return number !== filter.number;
		case NumberFilterMode.LESS_THAN:
			return number < filter.number;
		case NumberFilterMode.LESS_THAN_OR_EQUAL:
			return number <= filter.number;
		case NumberFilterMode.GREATER_THAN:
			return number > filter.number;
		case NumberFilterMode.GREATER_THAN_OR_EQUAL:
			return number >= filter.number;
	}
}
