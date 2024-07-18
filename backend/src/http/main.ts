import express from "express";
import { delete_expired_tokens } from "../db/api/tokens";

async function main() {
	const app = express();
	app.use("/api/v1", require("./api/v1").default);
	app.use("/", express.static("../frontend/static")); // yea
	app.listen(8080);


	setInterval(async () => await delete_expired_tokens(), 1000 * 60 * 60 * 12);
	await delete_expired_tokens();
}

main();
