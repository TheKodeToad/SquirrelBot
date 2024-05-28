import { Guild } from "oceanic.js";
import { bot } from "..";
import { BOT_ICON_GUILD } from "../../config";

const default_icons = {
	success: "\u2705", // :white_check_mark:
	error: "\u274C", // :x:
	warning: "\u26A0\uFE0F", // :warning:,
	info: "\u2139\uFE0F", // :information:
};

export const Icons = { ...default_icons };

export function install_icon_listener() {
	bot.once("ready", () => bot.guilds.forEach(load_icons));
	bot.on("guildCreate", guild => load_icons(guild));
	bot.on("guildAvailable", guild => load_icons(guild));
	bot.on("guildDelete", guild => unload_icons(guild.id));
	bot.on("guildUnavailable", guild => unload_icons(guild.id));
	bot.on("guildEmojisUpdate", guild => {
		if (!(guild instanceof Guild))
			return;

		unload_icons(guild.id);
		load_icons(guild);
	});
}

function load_icons(guild: Guild) {
	if (guild.id !== BOT_ICON_GUILD)
		return;

	for (const emoji of guild.emojis.values()) {
		if (!(emoji.name in Icons))
			continue;

		if (emoji.animated)
			Icons[emoji.name] = `<a:${emoji.name}:${emoji.id}>`;
		else
			Icons[emoji.name] = `<:${emoji.name}:${emoji.id}>`;
	}
}

function unload_icons(id: string) {
	if (id !== BOT_ICON_GUILD)
		return;

	Object.assign(Icons, default_icons);
}
