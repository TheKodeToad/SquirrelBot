// 17 - length of Jason Citron's ID
// 20 - length of 64-bit integer limit
const SNOWFLAKE_REGEX = /^[0-9]{17,20}$/;
const MAX_SNOWFLAKE_VALUE = 18446744073709551614n;

export function is_snowflake(input: string) {
	return SNOWFLAKE_REGEX.test(input) && BigInt(input) <= MAX_SNOWFLAKE_VALUE;
}