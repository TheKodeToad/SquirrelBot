let increment = 0n;
let lastTime = -1;

export const DUMMY_GUILD = mockSnowflake();

export function mockSnowflake(): string {
	const now = Date.now();

	if (lastTime === now) {
		++increment;
	} else {
		lastTime = now;
		increment = 0n;
	}

	return ((BigInt(now) << 22n) + increment).toString();
}
