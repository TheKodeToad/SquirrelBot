import type { z } from "zod/v4";

export class ConfigStore<T extends z.ZodType = z.ZodType>
	implements ConfigStore<T>
{
	private _cache: Map<string, z.output<T>>;
	schema: T;

	constructor(schema: T) {
		this.schema = schema;
		this._cache = new Map();
	}

	/** @returns The guild's config, or undefined if it's not available or disabled.  */
	get(guildID: string): z.output<T> | undefined {
		return this._cache.get(guildID);
	}

	/** @returns true if the guild config is available and not disabled */
	has(guildID: string): boolean {
		return this._cache.has(guildID);
	}

	set(guildID: string, value: z.output<T>): void {
		this._cache.set(guildID, value);
	}

	delete(guildID: string): void {
		this._cache.delete(guildID);
	}
}
