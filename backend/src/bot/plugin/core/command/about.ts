import { Colors } from "../../../common/discord/colors.ts";
import { bot } from "../../../index.ts";
import { core_config } from "../index.ts";
import { permissions_guard } from "../public/command/helper.ts";
import { define_command } from "../public/command/index.ts";
import { resolve_permissions } from "../public/permission_resolution.ts";

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

export const about_command = define_command({
	id: "about",
	track_updates: true,

	pre_run: context => permissions_guard(context, core_config, permissions => permissions.about_command),
	async run(context) {
		const config = core_config.get(context.guild.id);

		if (config === undefined)
			return;

		const perms = resolve_permissions(config, context.member, context.channel);

		if (!perms.about_command)
			return;

		const uptime = Math.floor(process.uptime());
		let uptime_string = "";

		if (uptime >= 3600)
			uptime_string += Math.floor(uptime / 3600) + " hours ";

		if (uptime >= 60)
			uptime_string += Math.floor(uptime / 60) % 60 + " mins ";

		uptime_string += uptime % 60 + " secs";

		await context.respond({
			embeds: [{
				color: Colors.yellow,
				title: "About SquirrelBot",
				description: DESCRIPTION,
				fields: [
					{ name: "Source Code", value: "https://github.com/TheKodeToad/SquirrelBot (MIT license)" },
					{ name: "Libraries", value: LIBRARIES },
					{ name: "Uptime", value: uptime_string }
				],
				thumbnail: { url: bot.user.avatarURL(undefined, 128) }
			}]
		});
	},
});