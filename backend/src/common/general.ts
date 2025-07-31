// NOTE: not needed in ES2025
export function* mapIterable<I, O>(iterable: Iterable<I>, transformer: (value: I) => O): Generator<O> {
	for (const value of iterable)
		yield transformer(value);
}

export function todo(): never {
	throw new Error("Function not implemented");
}

export type ValuesOf<T> = T[keyof T];
export type Awaitable<T> = T | PromiseLike<T>;
