import { Guild } from "oceanic.js";
import { bot } from "..";
import { upsert_guild_info } from "../../data/core/guild_info";
import { install_wrapped_listener } from "./event_wrapper";

export function install_guild_info_sync() {
	bot.guilds.forEach(update);
	install_wrapped_listener("guildCreate", update);
}

export async function update(guild: Guild) {
	await upsert_guild_info(guild.id, guild.name, guild.icon, guild.ownerID);
}