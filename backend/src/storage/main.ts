/* eslint no-console: 0 */

import { sqlite } from "#storage/index.ts";
import { checkMigrations, migrate } from "#storage/migration.ts";

const [_runtime, _script, command, ...args] = process.argv;

switch (command) {
case "perform": {
	const count = await migrate(args.includes("--ignore-changes"));
	sqlite.close();

	if (count > 0)
		console.log(`Done ${count} migrations!`);
	else
		console.log("No migrations needed!");

	break;
}
case "check": {
	const count = await checkMigrations();
	sqlite.close();

	if (count > 0) {
		console.error(`${count} migrations needed!`);
		process.exit(1);
	} else
		console.log("No migrations needed!");

	break;
}
default:
	console.error(`Usage: pnpm migration (perform|check) [--ignore-changes]`);
	break;
}
