/* eslint no-console: 0 */

import { transaction } from "#common/pg/transaction.ts";
import { dbParse } from "#storage/storage.ts";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import type { ClientBase } from "pg";
import { z } from "zod";
import "../environment.ts";

export async function migrate(
	db: ClientBase,
	ignoreChanges: boolean,
): Promise<number> {
	return await processMigrations(db, false, ignoreChanges);
}

export async function checkMigrations(db: ClientBase): Promise<number> {
	return await processMigrations(db, true, false);
}

export async function checkMigrationsOrExit(db: ClientBase): Promise<void> {
	const migrationsNeeded = await checkMigrations(db);

	if (migrationsNeeded === null) {
		process.exit(1);
	}

	if (migrationsNeeded > 0) {
		console.error(`${migrationsNeeded} migrations needed!`);
		console.error("Run pnpm migrate!");
		console.error(
			"Note: this cannot be reversed! Backups are *your* responsibility!",
		);
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

async function processMigrations(
	client: ClientBase,
	checkOnly: boolean,
	ignoreChanges: boolean,
): Promise<number> {
	await client.query(`
		CREATE TABLE IF NOT EXISTS "migration_files" (
			"number" INT NOT NULL PRIMARY KEY,
			"checksum" BYTEA NOT NULL
		)
	`);

	let runCount = 0;
	const files: string[] = [];

	const base = "migrations";

	for (const name of await fs.readdir(base)) {
		const itemPath = path.join(base, name);

		if (!(await fs.stat(itemPath)).isFile()) {
			continue;
		}

		const pattern = /^([0-9]+)-.+\.sql$/;
		const matches = pattern.exec(name);

		if (!matches) {
			continue;
		}

		const number = Number(matches[1]);

		if (Number.isNaN(number)) {
			continue;
		}

		files[number] = itemPath;
	}

	for (const [number, file] of files.entries()) {
		if (file === undefined) {
			throw new MigrationError(
				`Migration files are missing or numbers were skipped`,
			);
		}

		const { rows } = await client.query(
			`
				SELECT "checksum"
				FROM "migration_files"
				WHERE "number" = $1
			`,
			[number],
		);

		const content = await fs.readFile(file, "utf-8");
		const contentChecksum = crypto
			.createHash("sha1")
			.update(content)
			.digest();

		// already run
		if (rows.length !== 0) {
			const { checksum } = dbParse(JustChecksumBuffer, rows[0]);

			if (!checksum.equals(contentChecksum)) {
				const message = `"${file}" contents changed after it has already been run`;

				if (ignoreChanges) {
					console.warn(message);
					await client.query(
						`
							UPDATE "migration_files"
							SET "checksum" = $2
							WHERE "number" = $1
						`,
						[number, contentChecksum],
					);
					continue;
				} else {
					throw new MigrationError(
						message
							+ " - you may bypass this with pnpm migration perform --ignore-changes",
					);
				}
			}

			if (!checkOnly) {
				console.log(`Skipping "${file}" as it has already been run`);
			}

			continue;
		}

		++runCount;

		if (checkOnly) {
			console.error(`File "${file}" needs run!`);
			continue;
		}

		console.log(`Running file "${file}"`);

		await transaction(client, async () => {
			await client.query(content);
			await client.query(
				`
					INSERT INTO "migration_files" ("number", "checksum")
					VALUES ($1, $2)
				`,
				[number, contentChecksum],
			);
		});
	}

	return runCount;
}
