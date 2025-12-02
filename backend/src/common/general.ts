// NOTE: not needed in ES2025
export function* mapIterable<I, O>(
	iterable: Iterable<I>,
	transformer: (value: I) => O,
): Generator<O> {
	for (const value of iterable) {
		yield transformer(value);
	}
}

export function paddedHex(value: number, bytes: number): string {
	return "#" + value.toString(16).padStart(bytes * 2, "0");
}

export function todo(): never {
	throw new Error("Function not implemented");
}

/** @return true is the number is a valid 32-bit signed integer */
export function isSigned32(number: number): boolean {
	return number < 2 ** 31 && number >= -(2 ** 31);
}

export type ValuesOf<T> = T[keyof T];
export type Awaitable<T> = T | PromiseLike<T>;
export type Nullable<T> = {
	[TKey in keyof T]: T[TKey] | null;
};
