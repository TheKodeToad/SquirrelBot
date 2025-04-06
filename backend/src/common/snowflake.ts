const MIN_SNOWFLAKE_VALUE = 21414249976823808n;
const MAX_SNOWFLAKE_VALUE = 18446744073709551614n;

export function is_snowflake(input: string) {
	if (input.length < 17 || input.length > 20)
		return false;

	try {
		var parsed = BigInt(input);
	} catch (error) {
		if (!(error instanceof SyntaxError))
			throw error;

		return false;
	}

	return parsed >= MIN_SNOWFLAKE_VALUE && parsed <= MAX_SNOWFLAKE_VALUE;
}
