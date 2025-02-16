import { pool } from "./index.ts";
import { check_migrations, migrate } from "./migration.ts";

const command = process.argv[2];

switch (command) {
	case "migrate": {
		const count = await migrate();
		await pool.end();

		if (count > 0)
			console.log(`Done ${count} migrations!`);
		else
			console.log("No migrations needed!");

		break;
	}
	case "check": {
		const count = await check_migrations();
		await pool.end();

		if (count > 0) {
			console.error(`${count} migrations needed!`);
			process.exit(1);
		} else
			console.log("No migrations needed!");

		break;
	}
	default:
		console.error(`Usage: node ${process.argv[1]} <migrate|check>`);
		break;
}
