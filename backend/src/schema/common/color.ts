import { check, pipe, string, transform } from "valibot";

const pattern = /#[a-fA-F0-9]{6}/;

export const color_schema = pipe(
	string(),
	check(input => pattern.test(input)),
	transform(input => parseInt(input.substring(1), 16))
);