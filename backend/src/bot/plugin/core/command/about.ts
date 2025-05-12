import { APP_DESCRIPTION, APP_LIBRARIES_LINK, APP_NAME, APP_SOURCE_CODE } from "../../../../brand.ts";
import { bot } from "../../../index.ts";
import { Container, Section, Separator, Text, Thumbnail } from "../helper/componentSugar.ts";
import { coreConfig } from "../index.ts";
import { defineCommand } from "../public/command.ts";
import { permissionsGuard } from "../public/helper/commandGuards.ts";

const LIBRARIES = `
[Node.js](https://nodejs.org/),
[TypeScript](https://www.typescriptlang.org/),
[Oceanic.js](https://oceanic.ws/),
[PostgreSQL](https://www.postgresql.org/) with [node-postgres](https://node-postgres.com/),
[Hono](https://hono.dev/),
[smol-toml](https://github.com/squirrelchat/smol-toml),
[Valibot](https://valibot.dev/),
and [more](${APP_LIBRARIES_LINK})
`.substring(1).replaceAll("\n", " ");

export const aboutCommand = defineCommand({
	name: ["about"],
	description: "Display information about the app.",
	trackUpdates: true,

	preRun: context => permissionsGuard(context, coreConfig, permissions => permissions.about_command),
	async run(context) {
		const uptime = Math.floor(process.uptime());
		let uptimeString = "";

		uptimeString += Math.floor(uptime / 3600).toString() + "h ";
		uptimeString += (Math.floor(uptime / 60) % 60).toString().padStart(2, "0") + "m ";
		uptimeString += (uptime % 60).toString().padStart(2, "0") + "s ";

		const rssMiB = process.memoryUsage().rss / 1024 / 1024;
		const usedMiB = (process.memoryUsage().heapUsed + process.memoryUsage().arrayBuffers + process.memoryUsage().external) / 1024 / 1024;

		const uptimeComponent = Text(
			`**Uptime:** ${uptimeString}\n`
			+ `**Used Memory**: ${usedMiB.toLocaleString("en-US")} MiB (\`heapUsed\` + \`arrayBuffers\` + \`external\`)\n`
			+ `**Total Memory**: ${rssMiB.toLocaleString("en-US")} MiB (\`rss\`)`
		);

		const container = Container([
			Section(
				[Text(`## About ${APP_NAME}\n${APP_DESCRIPTION}`)],
				Thumbnail(bot.user.avatarURL())
			),
			Separator(),
			Text("**Source Code**\n" + APP_SOURCE_CODE),
			Text("**Libraries**\n" + LIBRARIES),
			uptimeComponent
		]);

		await context.respond({ components: [container] });
	},
});
