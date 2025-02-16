import fs from "fs/promises";
import path from "path";
import "../environment.ts";
import { pool } from "./index.ts";

export async function migrate() {
	return await process_all(false);
}

export async function check_migrations() {
	return await process_all(true);
}

export async function check_migrations_or_exit() {
	const migrations_needed = await check_migrations();

	if (migrations_needed > 0) {
		console.error(`${migrations_needed} migrations needed!`);
		console.error("Run pnpm migrate!");
		console.error("Note: this cannot be reversed! Backups are *your* responsibility!");
		process.exit(1);
	}
}

async function process_all(check_only: boolean): Promise<number> {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS "migration_dirs" (
			"path" TEXT NOT NULL PRIMARY KEY,
			"last_run" INT NOT NULL
		)
	`);

	let total = 0;

	const base = "migrations";

	for (const directory of await fs.readdir(base)) {
		const directory_path = path.join(base, directory);

		if (!(await fs.stat(directory_path)).isDirectory())
			continue;

		total += await process_in(directory_path, check_only);
	}

	return total;
}

async function process_in(dir: string, check_only: boolean): Promise<number> {
	let run_count = 0;
	const files: string[] = [];

	for (const name of await fs.readdir(dir)) {
		const item_path = path.join(dir, name);

		if ((await fs.stat(item_path)).isDirectory())
			continue;

		const pattern = /^([0-9]+)-\w+\.sql$/;
		const matches = pattern.exec(name);

		if (!matches)
			continue;

		const index = Number(matches[1]);

		if (Number.isNaN(index))
			continue;

		files[index] = item_path;
	}

	const last_run: number = (await pool.query(
		`
			SELECT "last_run"
			FROM "migration_dirs"
			WHERE "path" = $1
		`,
		[dir]
	)).rows[0]?.last_run ?? -1;

	for (const [index, file] of files.entries()) {
		if (file === undefined)
			continue;

		if (index <= last_run) {
			if (!check_only)
				console.log(`Skipping "${file}" as it has already been run`);

			continue;
		}

		++run_count;

		if (check_only) {
			console.error(`File "${file}" needs run!`);
			continue;
		}

		console.log(`Running file "${file}"`);

		const sql = await fs.readFile(file, "utf-8");
		const client = await pool.connect();

		let done = false;
		try {
			await client.query("BEGIN");

			await client.query(sql);
			await client.query(
				`
					INSERT INTO "migration_dirs" ("path", "last_run")
					VALUES ($1, $2)
					ON CONFLICT ("path")
					DO UPDATE SET "last_run" = $2
				`,
				[dir, index]
			);

			await client.query("COMMIT");
			done = true;
		} finally {
			if (!done)
				await client.query("ROLLBACK");

			client.release();
		}
	}

	return run_count;
}
