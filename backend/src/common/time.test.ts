import {
	DAY,
	HOUR,
	humanizeDuration,
	MINUTE,
	MONTH,
	SECOND,
	WEEK,
	YEAR,
} from "#common/time.ts";
import assert from "node:assert";
import test, { suite } from "node:test";

suite("duration humanization", () => {
	const check = (input: number, expected: string): void =>
		assert.equal(humanizeDuration(input), expected);

	test("singular unit", () => {
		check(1, "1ms");
		check(SECOND, "1 second");
		check(MINUTE, "1 minute");
		check(HOUR, "1 hour");
		check(DAY, "1 day");
		check(WEEK, "1 week");
		check(MONTH, "4 weeks and 2 days");
		check(YEAR, "1 year");
	});

	test("plural unit", () => {
		check(500, "500ms");
		check(2 * SECOND, "2 seconds");
		check(2 * MINUTE, "2 minutes");
		check(2 * HOUR, "2 hours");
		check(2 * DAY, "2 days");
		check(2 * WEEK, "2 weeks");
		check(2 * YEAR, "2 years");
	});

	test("combined units", () => {
		check(2 * MINUTE + 30 * SECOND, "2 minutes and 30 seconds");
		check(2 * HOUR + 30 * MINUTE, "2 hours and 30 minutes");
		check(2 * DAY + 12 * HOUR, "2 days and 12 hours");
		check(2 * WEEK + 4 * DAY, "2 weeks and 4 days");
		check(2 * MONTH + 2 * WEEK, "10 weeks and 4 days");
		check(2 * YEAR + 6 * MONTH, "2 years and 26 weeks");
	});

	test("ignored insignificant unit", () => {
		check(2.5 * SECOND, "2 seconds");
		check(2 * MINUTE + 500, "2 minutes");
		check(2 * HOUR + 30 * SECOND, "2 hours");
		check(2 * DAY + 30 * MINUTE, "2 days");
		check(2 * WEEK + 12 * HOUR, "2 weeks");
		check(2 * YEAR + 4 * DAY, "2 years");
	});
});
