import type { BaseIssue, BaseSchema, InferOutput } from "valibot";

export class ConfigCache<S extends BaseSchema<unknown, unknown, BaseIssue<unknown>> = BaseSchema<unknown, unknown, BaseIssue<unknown>>> implements ConfigCache<S> {
	private _cache: Map<string, InferOutput<S>>;
	schema: S;

	constructor(schema: S) {
		this.schema = schema;
		this._cache = new Map;
	}

	get(guildID: string): InferOutput<S> | undefined {
		return this._cache.get(guildID);
	}

	set(guildID: string, value: InferOutput<S>): void {
		this._cache.set(guildID, value);
	}

	delete(guildID: string): void {
		this._cache.delete(guildID);
	}
}
