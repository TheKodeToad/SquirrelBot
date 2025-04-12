import { isSnowflake } from "../../../../common/snowflake.ts";
import { requireExhaustiveSwitch } from "../../../../common/types.ts";
import { INTERNAL_TYPE_INTEGRITY } from "../../../../environment.ts";
import { OptionType, type AnyArgsValue, type AnyArgsValueItem, type Option } from "../public/command/index.ts";

export class SafeArgs {
	private _schema: Record<string, Option>;
	private _result: Record<string, AnyArgsValue>;
	private _missing: Set<string>;

	constructor(schema: Record<string, Option>) {
		this._schema = schema;
		this._result = {};
		this._missing = new Set;

		for (const key in schema) {
			if (!Object.hasOwn(schema, key))
				continue;

			const option = this._schema[key];

			if (option === undefined)
				continue;

			const value: AnyArgsValue = (option.array ?? false) ? [] : null;
			this._resultDefine(key, value);

			if (option.required ?? false)
				this._missing.add(key);
		}
	}

	// TODO: biggest bottleneck of parser lol
	private _resultDefine(key: string, value: AnyArgsValue) {
		Object.defineProperty(this._result, key, {
			configurable: true,
			enumerable: true,
			value,
		});
	}

	private _getSchemaValue(key: string): Option {
		if (!Object.hasOwn(this._schema, key))
			throw new Error(`Option schema does not contain key '${key}'`);

		const option = this._schema[key];

		if (typeof option !== "object")
			throw new Error(`typeof options['${key}'] is '${option}'`);

		return option;
	}

	set(key: string, value: AnyArgsValue) {
		const option = this._getSchemaValue(key);

		if (option.array ?? false)
			throw new Error(`Set instead of add used for options['${key}']`);

		validateType(option.type, value);

		this._resultDefine(key, value);
		this._missing.delete(key);
	}

	pushTo(key: string, ...value: AnyArgsValueItem[]) {
		const option = this._getSchemaValue(key);

		if (!(option.array ?? false))
			throw new Error(`Add used instead of set for options['${key}']`);

		if (!Object.hasOwn(this._result, key))
			throw new Error(`Result does not contain key '${key}'`);

		const array = this._result[key];

		if (!Array.isArray(array))
			throw new Error(`Array.isArray(result['${key}']) is false; expected true`);

		if (value.length === 0)
			return;

		for (const item of value)
			validateType(option.type, item);

		array.push(...value);
		this._missing.delete(key);
	}

	getMissing() {
		return this._missing;
	}

	getFrozenResult() {
		Object.freeze(this._result);

		for (const key in this._result) {
			if (!Object.hasOwn(this._result, key))
				continue;

			const object = this._result[key];

			if (typeof key !== "object")
				continue;

			Object.freeze(object);
		}

		if (this._missing.size !== 0)
			throw new Error(`Missing keys: ${[...this._missing].map(value => "'" + value + "'").join(",")}`);

		return this._result;
	}
}

function validateType(type: OptionType, value: unknown): void {
	if (!INTERNAL_TYPE_INTEGRITY)
		return;

	switch (type) {
		case OptionType.BOOLEAN:
		case OptionType.FLAG:
			if (typeof value !== "boolean")
				throw new Error(`typeof value is '${typeof value}'; expected 'boolean'`);

			break;

		case OptionType.INTEGER:
			if (!Number.isSafeInteger(value))
				throw new Error(`Number.isSafeInteger(value) is false`);

			break;

		case OptionType.NUMBER:
			if (!Number.isFinite(value))
				throw new Error(`Number.isFinite(value) is false`);

			break;

		case OptionType.STRING:
			if (typeof value !== "string")
				throw new Error(`typeof value is '${typeof value}'; expected 'string'`);

			break;

		case OptionType.SNOWFLAKE:
		case OptionType.USER:
		case OptionType.ROLE:
		case OptionType.CHANNEL:
			if (typeof value !== "string")
				throw new Error(`typeof value is '${typeof value}'; expected 'string'`);

			if (!isSnowflake(value))
				throw new Error(`isSnowflake('${value}') is false`);

			break;

		default:
			requireExhaustiveSwitch(type);
			break;
	}
}

