export function* map_iteratable<I, O>(iterable: Iterable<I>, transformer: (value: I) => O): Generator<O> {
	for (const value of iterable)
		yield transformer(value);
}