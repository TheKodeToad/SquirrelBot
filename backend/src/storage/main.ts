/* eslint no-console: 0 */

import { checkMigrations, migrate } from "#storage/migration.ts";
import { Client } from "pg";

const [_runtime, _script, command, ...args] = process.argv;

switch (command) {
case "perform": {
	const db = new Client;
	await db.connect();

	const count = await migrate(db, args.includes("--ignore-changes"));

	await db.end();

	if (count > 0) {
		console.log(`Done ${count} migrations!`);
	} else {
		console.log("No migrations needed!");
	}

	break;
}
case "check": {
	const db = new Client;
	await db.connect();

	const count = await checkMigrations(db);

	await db.end();

	if (count > 0) {
		console.error(`${count} migrations needed!`);
		process.exit(1);
	} else {
		console.log("No migrations needed!");
	}

	break;
}
default:
	console.error(`Usage: pnpm migration (perform|check) [--ignore-changes]`);
	break;
}
