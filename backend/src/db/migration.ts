import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import "../environment.ts";
import { pool } from "./index.ts";

export async function migrate(ignore_errors: boolean) {
	return await process_migrations(false, ignore_errors);
}

export async function check_migrations() {
	return await process_migrations(true, false);
}

export async function check_migrations_or_exit() {
	const migrations_needed = await check_migrations();

	if (migrations_needed === null)
		process.exit(1);

	if (migrations_needed > 0) {
		console.error(`${migrations_needed} migrations needed!`);
		console.error("Run pnpm migrate!");
		console.error("Note: this cannot be reversed! Backups are *your* responsibility!");
		process.exit(1);
	}
}

class MigrationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MigrationError";
	}
}

async function process_migrations(check_only: boolean, ignore_errors: boolean): Promise<number> {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS "migration_files" (
			"number" INT NOT NULL PRIMARY KEY,
			"checksum" BYTEA NOT NULL
		)
	`);

	let run_count = 0;
	const files: string[] = [];

	const base = "migrations";

	for (const name of await fs.readdir(base)) {
		const item_path = path.join(base, name);

		if (!(await fs.stat(item_path)).isFile())
			continue;

		const pattern = /^([0-9]+)-.+\.sql$/;
		const matches = pattern.exec(name);

		if (!matches)
			continue;

		const number = Number(matches[1]);

		if (Number.isNaN(number))
			continue;

		files[number] = item_path;
	}

	for (const [number, file] of files.entries()) {
		if (file === undefined)
			throw new MigrationError(`Migration files are missing or numbers were skipped`);

		const { rows } = await pool.query(
			`
				SELECT "checksum"
				FROM "migration_files"
				WHERE "number" = $1
			`,
			[number]
		);

		const content = await fs.readFile(file, "utf-8");
		const content_checksum = crypto.createHash("sha1").update(content).digest();

		// already run
		if (rows.length !== 0) {
			const { checksum }: { checksum: Buffer; } = rows[0];

			if (!checksum.equals(content_checksum)) {
				const message = `"${file}" contents changed after it has already been run`;

				if (ignore_errors) {
					console.warn(message);
					await pool.query(
						`
							UPDATE "migration_files"
							SET "checksum" = $2
							WHERE "number" = $1`,
						[number, content_checksum]
					);
					continue;
				} else
					throw new MigrationError(message);
			}

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

		const client = await pool.connect();

		let done = false;
		try {

			await client.query("BEGIN");

			await client.query(content);
			await client.query(
				`
					INSERT INTO "migration_files" ("number", "checksum")
					VALUES ($1, $2)
				`,
				[number, content_checksum]
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
