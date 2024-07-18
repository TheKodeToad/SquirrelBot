import { Guild } from "oceanic.js";
import { bot } from "../..";
import { BOT_ICON_GUILD } from "../../../environment";
import { icons } from "../../icons";
import { define_event_listener } from "../../types/event_listener";

const default_icons = {
	success: "\u2705", // :white_check_mark:
	error: "\u274C", // :x:
	warning: "\u26A0\uFE0F", // :warning:,
	info: "\u2139\uFE0F", // :information:
};

export function init_icons() {
	Object.assign(icons, default_icons);
	console.log(icons);
	bot.guilds.forEach(guild => update(guild));
}

function update(guild: Guild) {
	if (guild.id !== BOT_ICON_GUILD)
		return;

	for (const emoji of guild.emojis.values()) {
		if (!(emoji.name in icons))
			continue;

		if (emoji.animated)
			icons[emoji.name] = `<a:${emoji.name}:${emoji.id}>`;
		else
			icons[emoji.name] = `<:${emoji.name}:${emoji.id}>`;
	}
}

export const icon_sync_guild_create_handler = define_event_listener("guildCreate", update);
export const icon_sync_guild_delete_handler = define_event_listener("guildDelete", guild => {
	if (guild.id !== BOT_ICON_GUILD)
		return;

	Object.assign(icons, default_icons);
});
