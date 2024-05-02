/**
 * A map where keys expire!
 * A slight catch: every value must last for the same duration
 */
export class TTLMap<K, V> implements Map<K, V> {
	private readonly _map: Map<K, [V, number]>;
	private readonly _ttl: number;

	constructor(ttl: number) {
		this._map = new Map;
		this._ttl = ttl;
	}

	cleanup() {
		const now = Date.now();

		for (const [key, [_, date]] of this._map) {
			if (!this._is_expired(now, date))
				break;

			this._map.delete(key);
		}
	}

	private _is_expired(now: number, date: number) {
		return (now - date) > this._ttl;
	}

	get size(): number {
		const now = Date.now();
		let count = 0;

		for (const [_, date] of this._map.values())
			if (!this._is_expired(now, date))
				++count;

		return count;
	}

	clear(): void {
		this._map.clear();
	}

	delete(key: K): boolean {
		return this._map.delete(key);
	}

	forEach(callbackfn: (value: V, key: K, map: TTLMap<K, V>) => void, thisArg?: any): void {
		if (thisArg !== undefined && thisArg !== null)
			callbackfn = callbackfn.bind(thisArg);

		for (const entry of this)
			callbackfn(entry[1], entry[0], this);
	}

	get(key: K): V | undefined {
		const entry = this._map.get(key);
		if (entry === undefined)
			return undefined;

		const [value, date] = this._map.get(key)!;
		if (this._is_expired(Date.now(), date))
			return undefined;

		return value;
	}

	has(key: K): boolean {
		if (!this._map.has(key))
			return false;

		const [_, date] = this._map.get(key)!;
		return this._is_expired(Date.now(), date);
	}

	set(key: K, value: V): this {
		this._map.set(key, [value, Date.now()]);
		return this;
	}

	*entries(): IterableIterator<[K, V]> {
		const now = Date.now();

		for (const [key, [value, date]] of this._map)
			if (!this._is_expired(now, date))
				yield [key, value];
	};

	keys(): IterableIterator<K> {
		return this._map.keys();
	}

	*values(): IterableIterator<V> {
		const now = Date.now();

		for (const [value, date] of this._map.values())
			if (!this._is_expired(now, date))
				yield value;
	}

	*[Symbol.iterator](): IterableIterator<[K, V]> {
		const now = Date.now();

		for (const [key, [value, date]] of this._map)
			if (!this._is_expired(now, date))
				yield [key, value];
	}

	get [Symbol.toStringTag](): string {
		return "Object";
	}
}