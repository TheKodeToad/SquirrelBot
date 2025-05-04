import type { BaseIssue, BaseSchema, InferOutput } from "valibot";

export class ConfigStore<S extends BaseSchema<unknown, {}, BaseIssue<unknown>> = BaseSchema<unknown, {}, BaseIssue<unknown>>> implements ConfigStore<S> {
	private _cache: Map<string, InferOutput<S>>;
	schema: S;
	defaultValue: string;

	constructor(schema: S, defaultValue: string = "enabled = false\n") {
		this.schema = schema;
		this.defaultValue = defaultValue + "\n";
		this._cache = new Map;
	}

	/** @returns The guild's config, or undefined if it's not available or disabled.  */
	get(guildID: string): InferOutput<S> | undefined {
		return this._cache.get(guildID);
	}

	/** @returns true if the guild config is available and not disabled */
	has(guildID: string): boolean {
		return this._cache.has(guildID);
	}

	set(guildID: string, value: InferOutput<S>): void {
		this._cache.set(guildID, value);
	}

	delete(guildID: string): void {
		this._cache.delete(guildID);
	}
}
