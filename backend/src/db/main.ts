import { pool } from "./index.ts";
import { checkMigrations, migrate } from "./migration.ts";

const [_, script, command, ...args] = process.argv;

switch (command) {
	case "migrate": {
		const count = await migrate(args.includes("--ignore-errors"));
		await pool.end();

		if (count > 0)
			console.log(`Done ${count} migrations!`);
		else
			console.log("No migrations needed!");

		break;
	}
	case "check": {
		const count = await checkMigrations();
		await pool.end();

		if (count > 0) {
			console.error(`${count} migrations needed!`);
			process.exit(1);
		} else
			console.log("No migrations needed!");

		break;
	}
	default:
		console.error(`Usage: node ${script} <migrate|check> [--ignore-errors]`);
		break;
}
