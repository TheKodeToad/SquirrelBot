import {
	APP_DESCRIPTION,
	APP_LIBRARIES_LINK,
	APP_NAME,
	APP_SOURCE_CODE,
} from "#brand.ts";
import { coreConfigStore } from "#plugins/core/plugin.ts";
import { permissionsGuard } from "#plugins/core/public/commandGuards.ts";
import { defineCommand } from "#plugins/core/public/extensionPoints.ts";
import {
	Container,
	Divider,
	Section,
	Text,
	Thumbnail,
} from "oceanic-component-helper";

const LIBRARIES = `
[Node.js](https://nodejs.org/),
[TypeScript](https://www.typescriptlang.org/),
[Oceanic.js](https://oceanic.ws/),
[PostgreSQL](https://www.postgresql.org/) with [node-postgres](https://node-postgres.com/),
[Hono](https://hono.dev/),
[smol-toml](https://github.com/squirrelchat/smol-toml),
[Zod](https://zod.dev/),
and [more](${APP_LIBRARIES_LINK})
`
	.substring(1)
	.replaceAll("\n", " ");

export default defineCommand({
	name: ["about"],
	description: "Display information about the app.",
	trackUpdates: true,

	preRun: (ctx) =>
		permissionsGuard(
			ctx,
			coreConfigStore,
			(permissions) => permissions.aboutCommand,
		),
	async run(ctx) {
		const uptime = Math.floor(process.uptime());
		let uptimeString = "";

		uptimeString += Math.floor(uptime / 3600).toString() + "h ";
		uptimeString +=
			(Math.floor(uptime / 60) % 60).toString().padStart(2, "0") + "m ";
		uptimeString += (uptime % 60).toString().padStart(2, "0") + "s ";

		const rssMiB = process.memoryUsage().rss / 1024 / 1024;
		const usedMiB =
			(process.memoryUsage().heapUsed +
				process.memoryUsage().arrayBuffers +
				process.memoryUsage().external) /
			1024 /
			1024;

		const uptimeComponent = Text(
			`**Uptime:** ${uptimeString}\n` +
				`**Used Memory**: ${usedMiB.toLocaleString("en-US")} MiB (\`heapUsed\` + \`arrayBuffers\` + \`external\`)\n` +
				`**Total Memory**: ${rssMiB.toLocaleString("en-US")} MiB (\`rss\`)`,
		);

		const container = Container([
			Section(
				[`## About ${APP_NAME}\n${APP_DESCRIPTION}`],
				Thumbnail(ctx.bot.user.avatarURL()),
			),
			Divider(),
			Text("**Source Code**\n" + APP_SOURCE_CODE),
			Text("**Libraries**\n" + LIBRARIES),
			uptimeComponent,
		]);

		await ctx.respond({ components: [container] });
	},
});
