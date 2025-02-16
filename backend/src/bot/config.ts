import type { BaseIssue, BaseSchema, InferOutput } from "valibot";

export class ConfigCache<S extends BaseSchema<unknown, unknown, BaseIssue<unknown>> = BaseSchema<unknown, unknown, BaseIssue<unknown>>> implements ConfigCache<S> {
	private _cache: Map<string, InferOutput<S>>;
	schema: S;

	constructor(schema: S) {
		this.schema = schema;
		this._cache = new Map;
	}

	get(guild_id: string): InferOutput<S> | undefined {
		return this._cache.get(guild_id);
	}

	set(guild_id: string, value: InferOutput<S>) {
		this._cache.set(guild_id, value);
	}

	delete(guild_id: string) {
		this._cache.delete(guild_id);
	}
}
