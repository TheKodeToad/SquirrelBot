import { Guild } from "oceanic.js";
import { upsert_guild_info } from "../../../db/core/guild_info.ts";
import { bot } from "../../index.ts";
import { define_event_listener } from "../../types/event_listener.ts";

export async function init_guild_info() {
	await Promise.all(bot.guilds.map(guild => update_guild(guild)));
}

async function update_guild(guild: Guild) {
	await upsert_guild_info(guild.id, guild.name, guild.icon, guild.ownerID);
}

export const guild_info_sync_guild_create_handler = define_event_listener("guildCreate", async guild => {
	await update_guild(guild);
});
