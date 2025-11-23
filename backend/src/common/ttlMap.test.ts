import { MINUTE, SECOND } from "#common/time.ts";
import { TTLMap } from "#common/ttlMap.ts";
import assert from "node:assert";
import test, { suite } from "node:test";

let time = 0;

function mockTime<T>(callback: () => T): T {
	// reset mocked value
	time = 0;

	const oldDateNow = Date.now;
	Date.now = () => time;

	try {
		return callback();
	} finally {
		Date.now = oldDateNow;
	}
}

function assertConsistentData<V>(
	map: TTLMap<string, V>,
	data: Record<string, V>,
): void {
	assert.equal(map.size, Object.keys(data).length, "map size == data size");
	assert.deepEqual(
		[...map.keys()],
		Object.keys(data),
		"map keys == data keys",
	);
	assert.deepEqual(
		[...map.values()],
		Object.values(data),
		"map values == data values",
	);
	assert.deepEqual(
		[...map.entries()],
		Object.entries(data),
		"map entries == data entries",
	);

	const fromForEach: [string, V][] = [];
	map.forEach((value, key) => fromForEach.push([key, value]));
	assert.deepEqual(
		fromForEach,
		Object.entries(data),
		"forEach entries == data entries",
	);

	const fromForOf: [string, V][] = [];

	for (const [key, value] of map) {
		fromForOf.push([key, value]);
	}

	for (const key in data) {
		assert.ok(map.has(key), `map.has('${key}')`);
	}

	assert.deepEqual(
		fromForOf,
		Object.entries(data),
		"for of entries == data entries",
	);
}

function assertInternalData<V>(
	map: TTLMap<string, V>,
	data: Record<string, V>,
): void {
	assert.deepEqual(
		[...map["_map"].entries()].map(([key, [value]]) => [key, value]),
		Object.entries(data),
	);
}

suite("TTLMap", () => {
	test("instant expiry", () =>
		mockTime(() => {
			const map: TTLMap<string, number> = new TTLMap(0);

			map.set("a", 1);
			map.set("b", 2);
			map.set("c", 3);

			assertConsistentData(map, {});
			assertInternalData(map, { a: 1, b: 2, c: 3 });

			map.cleanup();
			assertConsistentData(map, {});
			assertInternalData(map, {});
		}));

	test("staggered expiry", () =>
		mockTime(() => {
			const map: TTLMap<string, number> = new TTLMap(MINUTE);

			map.set("a", 1);
			assertConsistentData(map, { a: 1 });
			assertInternalData(map, { a: 1 });
			time += 20 * SECOND;

			map.set("b", 2);
			assertConsistentData(map, { a: 1, b: 2 });
			assertInternalData(map, { a: 1, b: 2 });
			time += 20 * SECOND;

			map.set("c", 3);
			assertConsistentData(map, { a: 1, b: 2, c: 3 });
			assertInternalData(map, { a: 1, b: 2, c: 3 });
			time += 20 * SECOND;

			map.set("d", 4);
			assertConsistentData(map, { b: 2, c: 3, d: 4 });
			assertInternalData(map, { a: 1, b: 2, c: 3, d: 4 });
			time += 20 * SECOND;

			assertConsistentData(map, { c: 3, d: 4 });
			assertInternalData(map, { a: 1, b: 2, c: 3, d: 4 });
			map.cleanup();
			assertInternalData(map, { c: 3, d: 4 });

			time += 1 * MINUTE;
			assertConsistentData(map, {});
			assertInternalData(map, { c: 3, d: 4 });
			map.cleanup();
			assertConsistentData(map, {});
			assertInternalData(map, {});
		}));

	test("has", () =>
		mockTime(() => {
			const map: TTLMap<string, null> = new TTLMap(0);
			map.set("a", null);
			assert.ok(!map.has("a"), "!map.has('a')");
		}));

	test("delete", () =>
		mockTime(() => {
			const map: TTLMap<string, null> = new TTLMap(SECOND);

			map.set("a", null);
			assert.ok(map.delete("a"), "map.delete('a')");
			assert.ok(!map.delete("a"), "!map.delete('a')");

			map.set("a", null);
			time += SECOND;

			assert.ok(!map.delete("a"), "!map.delete('a') (after expiry)");
		}));

	test("precision", () =>
		mockTime(() => {
			const map: TTLMap<string, number> = new TTLMap(SECOND);

			map.set("a", 0);
			time += 1;
			map.set("b", 1);
			time += SECOND - 2;

			assertConsistentData(map, { a: 0, b: 1 });
			time += 1;

			assertConsistentData(map, { b: 1 });
			time += 1;

			assertConsistentData(map, {});
		}));

	test("forEach this arg", () =>
		mockTime(() => {
			const map: TTLMap<string, null> = new TTLMap(SECOND);
			map.set("a", null);
			map.set("b", null);

			function unbound(this: undefined): void {
				assert.equal(this, undefined);
			}

			function bound(this: string): void {
				assert.equal(this, "foo");
			}

			map.forEach(unbound);
			map.forEach(bound, "foo");
		}));
});
