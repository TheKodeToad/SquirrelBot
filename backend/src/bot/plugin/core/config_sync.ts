import { add_channel_listener } from "../../../db/notification";
import { get_config_cache } from "./api/config_cache";

export async function install_config_change_listener(): Promise<void> {
	await add_channel_listener("config_update", payload => {
		if (payload === undefined)
			return;

		const [key, guild_id] = payload.split(",", 2);

		// TODO: log warning
		if (key === undefined || guild_id === undefined)
			return;

		const caches = get_config_cache(key);

		if (caches === undefined)
			return;

		for (const cache of caches)
			cache.invalidate(guild_id);
	});
}