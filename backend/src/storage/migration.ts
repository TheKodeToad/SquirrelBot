/* eslint no-console: 0 */

import { dbParse, sqlite } from "#storage/index.ts";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { z } from "zod/v4";
import "../environment.ts";

export async function migrate(ignoreChanges: boolean): Promise<number> {
	return await processMigrations(false, ignoreChanges);
}

export async function checkMigrations(): Promise<number> {
	return await processMigrations(true, false);
}

export async function checkMigrationsOrExit(): Promise<void> {
	const migrationsNeeded = await checkMigrations();

	if (migrationsNeeded === null)
		process.exit(1);

	if (migrationsNeeded > 0) {
		console.error(`${migrationsNeeded} migrations needed!`);
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

const JustChecksumBuffer = z.strictObject({ checksum: z.instanceof(Buffer) });

async function processMigrations(checkOnly: boolean, ignoreChanges: boolean): Promise<number> {
	sqlite.prepare(`
		CREATE TABLE IF NOT EXISTS "migration_files" (
			"number" INT NOT NULL PRIMARY KEY,
			"checksum" BYTEA NOT NULL
		)
	`).run();

	let runCount = 0;
	const files: string[] = [];

	const base = "migrations";

	for (const name of await fs.readdir(base)) {
		const itemPath = path.join(base, name);

		if (!(await fs.stat(itemPath)).isFile())
			continue;

		const pattern = /^([0-9]+)-.+\.sql$/;
		const matches = pattern.exec(name);

		if (!matches)
			continue;

		const number = Number(matches[1]);

		if (Number.isNaN(number))
			continue;

		files[number] = itemPath;
	}

	for (const [number, file] of files.entries()) {
		if (file === undefined)
			throw new MigrationError(`Migration files are missing or numbers were skipped`);

		const rows = sqlite.prepare(
			`
				SELECT "checksum"
				FROM "migration_files"
				WHERE "number" = ?
			`
		).all(number);

		const content = await fs.readFile(file, "utf-8");
		const contentChecksum = crypto.createHash("sha1").update(content).digest();

		// already run
		if (rows.length !== 0) {
			const { checksum } = dbParse(JustChecksumBuffer, rows[0]);

			if (!checksum.equals(contentChecksum)) {
				const message = `"${file}" contents changed after it has already been run`;

				if (ignoreChanges) {
					console.warn(message);
					sqlite.prepare(
						`
							UPDATE "migration_files"
							SET "checksum" = ?
							WHERE "number" = ?
						`
					).run(contentChecksum, number);
					continue;
				} else
					throw new MigrationError(message + " - you may bypass this with pnpm migration perform --ignore-changes");
			}

			if (!checkOnly)
				console.log(`Skipping "${file}" as it has already been run`);

			continue;
		}

		++runCount;

		if (checkOnly) {
			console.error(`File "${file}" needs run!`);
			continue;
		}

		console.log(`Running file "${file}"`);

		let run = () => {
			sqlite.exec(content);
			sqlite.prepare(
				`
					INSERT INTO "migration_files" ("number", "checksum")
					VALUES (?, ?)
				`
			).run(number, contentChecksum);
		}

		if (!content.startsWith("-- no-transaction"))
			run = sqlite.transaction(run);

		run();
	}

	return runCount;
}
