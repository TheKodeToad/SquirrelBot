import { Colors } from "../../../common/discord/colors.ts";
import { bot } from "../../../index.ts";
import { coreConfig } from "../index.ts";
import { permissionsGuard } from "../public/command/helper.ts";
import { defineCommand } from "../public/command/index.ts";

const DESCRIPTION = `
Advanced moderation and management bot created by TheKodeToad.

Made in England with [Oceanic.js](https://oceanic.ws/) and love!
Some inspiration taken from [Zepplin](https://zeppelin.gg/).

Icons from [Tabler](https://tabler.io/icons).
`.replaceAll("\t", "");

const LIBRARIES = `
[Node.js](https://nodejs.org/),
 [TypeScript](https://www.typescriptlang.org/),
 [Oceanic.js](https://oceanic.ws/),
 [PostgreSQL](https://www.postgresql.org/) with [node-postgres](https://node-postgres.com/),
 [Hono](https://hono.dev/),
 [smol-toml](https://github.com/squirrelchat/smol-toml),
 [Valibot](https://valibot.dev/),
 and [more](https://github.com/TheKodeToad/SquirrelBot/blob/develop/backend/package.json)
`.replaceAll("\n", "");

export const aboutCommand = defineCommand({
	name: ["about"],
	trackUpdates: true,

	preRun: context => permissionsGuard(context, coreConfig, permissions => permissions.about_command),
	async run(context) {
		const uptime = Math.floor(process.uptime());
		let uptimeString = "";

		if (uptime >= 3600)
			uptimeString += Math.floor(uptime / 3600) + " hours ";

		if (uptime >= 60)
			uptimeString += Math.floor(uptime / 60) % 60 + " mins ";

		uptimeString += uptime % 60 + " secs";

		await context.respond({
			embeds: [{
				color: Colors.yellow,
				title: "About SquirrelBot",
				description: DESCRIPTION,
				fields: [
					{ name: "Source Code", value: "https://github.com/TheKodeToad/SquirrelBot (MIT license)" },
					{ name: "Libraries", value: LIBRARIES },
					{ name: "Uptime", value: uptimeString }
				],
				thumbnail: { url: bot.user.avatarURL(undefined, 128) }
			}]
		});
	},
});