import { cancel_guild_info_deletion, get_all_guild_info, insert_guild_info, mark_guild_allowed, mark_guild_not_allowed, mark_unknown_guild_allowed, schedule_guild_info_deletion, update_guild_info } from "../../../db/core/guild_info.ts";
import { BOT_ALLOWED_GUILDS } from "../../../environment.ts";
import { bot } from "../../index.ts";
import { define_event_listener } from "./public/event_listener.ts";

type Listener = (guild_id: string) => unknown;

const allowed_guilds: Set<string> = new Set;
const grant_listeners: Listener[] = [];
const revoke_listeners: Listener[] = [];

export async function init_guild_info() {
	const guilds_info = await get_all_guild_info();
	// guilds from env var, remove those which are already present
	const missing = [...BOT_ALLOWED_GUILDS];

	for (const guild_info of guilds_info) {
		const missing_index = missing.indexOf(guild_info.id);

		if (missing_index !== -1) {
			missing.splice(missing_index, 1);

			if (guild_info.delete_at !== null)
				await cancel_guild_info_deletion(guild_info.id);
		} else if (!guild_info.allowed) {
			// was removed from env var
			if (guild_info.delete_at === null)
				await schedule_guild_info_deletion(guild_info.id);

			continue;
		}

		if (guild_info.allowed)
			allowed_guilds.add(guild_info.id);

		const real_guild = bot.guilds.get(guild_info.id);

		if (real_guild === undefined)
			continue;

		if (guild_info.name === real_guild.name
			&& guild_info.icon_hash === real_guild.icon
			&& guild_info.owner_id === real_guild.ownerID) {
			continue;
		}

		await update_guild_info(guild_info.id, real_guild.name, real_guild.icon, real_guild.ownerID);
	}

	for (const missing_guild_id of missing) {
		const real_guild = bot.guilds.get(missing_guild_id);

		await insert_guild_info(
			missing_guild_id,
			real_guild?.ownerID ?? null,
			real_guild?.name ?? null,
			real_guild?.icon ?? null,
			false,
		);
	}
}

export function is_guild_allowed(id: string) {
	return allowed_guilds.has(id) || BOT_ALLOWED_GUILDS.includes(id);
}

export function* get_allowed_guilds(): Generator<string> {
	for (const id of BOT_ALLOWED_GUILDS)
		if (!allowed_guilds.has(id))
			yield id;

	for (const id of allowed_guilds)
		yield id;
}

export function add_grant_access_listener(listener: Listener): void {
	grant_listeners.push(listener);
}

export function add_revoke_access_listener(listener: Listener): void {
	revoke_listeners.push(listener);
}

export async function grant_access(id: string): Promise<boolean> {
	if (allowed_guilds.has(id))
		return false;

	const real_guild = bot.guilds.get(id);

	if (real_guild !== undefined) {
		await mark_guild_allowed(
			id,
			real_guild?.ownerID ?? null,
			real_guild?.name ?? null,
			real_guild?.icon ?? null,
		);
	} else
		await mark_unknown_guild_allowed(id);

	allowed_guilds.add(id);

	if (!BOT_ALLOWED_GUILDS.includes(id))
		for (const listeners of grant_listeners)
			listeners(id);

	return true;
}

export async function revoke_access(id: string): Promise<false | true | Date> {
	if (!allowed_guilds.has(id))
		return false;

	if (BOT_ALLOWED_GUILDS.includes(id)) {
		await mark_guild_not_allowed(id);
		allowed_guilds.delete(id);
		return true;
	} else {
		const date = await schedule_guild_info_deletion(id);
		allowed_guilds.delete(id);

		for (const listener of revoke_listeners)
			listener(id);

		return date ?? false;
	}
}

export const guild_info_sync_guild_create_handler = define_event_listener("guildCreate", async guild => {
	if (is_guild_allowed(guild.id))
		await update_guild_info(guild.id, guild.name, guild.icon, guild.ownerID);
});

export const guild_info_sync_guild_update_handler = define_event_listener("guildUpdate", async (guild, old_guild) => {
	if (old_guild === null)
		return;

	if (!is_guild_allowed(guild.id))
		return;

	if (old_guild.name === guild.name
		&& old_guild.icon === guild.icon
		&& old_guild.ownerID === guild.ownerID) {
		return;
	}

	await update_guild_info(guild.id, guild.name, guild.icon, guild.ownerID);
});

