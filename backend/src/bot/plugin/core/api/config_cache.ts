import { TomlError, parse as parseToml } from "smol-toml";
import { BaseIssue, BaseSchema, InferOutput, safeParse } from "valibot";
import { get_guild_config } from "../../../../db/core/config";

const cache_lookup: Map<string, ConfigCache<any>[]> = new Map;

export class ConfigCache<S extends BaseSchema<unknown, unknown, BaseIssue<unknown>>> implements ConfigCache<S> {
	private _key: string;
	private _schema: S;
	private _cache: Map<string, InferOutput<S>>;

	constructor(key: string, schema: S) {
		this._key = key;
		this._schema = schema;
		this._cache = new Map;
	}

	async get(guild_id: string): Promise<InferOutput<S> | null> {
		const cached = this._cache.get(guild_id);

		if (cached !== undefined)
			return cached;

		const raw_value = await get_guild_config(guild_id, this._key);

		if (raw_value === null) {
			this._cache.set(guild_id, null);
			return null;
		}

		try {
			var table = parseToml(raw_value);
		} catch (error) {
			if (!(error instanceof TomlError))
				throw error;

			this._cache.set(guild_id, null);
			return null;
		}

		const result = safeParse(this._schema, table);

		if (!result.typed) {
			this._cache.set(guild_id, null);
			return null;
		}

		this._cache.set(guild_id, result.output);
		return result.output;
	}

	invalidate(guild_id: string) {
		this._cache.delete(guild_id);
	}
}

export function register_config_cache(cache: ConfigCache<any>): void {
	const caches = cache_lookup.get(cache["_key"]);

	if (caches === undefined)
		cache_lookup.set(cache["_key"], [cache]);
	else
		caches.push(cache);
}

export function get_config_cache(key: string) {
	return cache_lookup.get(key) ?? [];
}
