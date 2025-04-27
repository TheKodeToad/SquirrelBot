import { isSnowflake } from "../../../../common/snowflake.ts";
import { requireExhaustiveSwitch } from "../../../../common/types.ts";
import { INTERNAL_TYPE_INTEGRITY } from "../../../../environment.ts";
import { OptionType, type AnyArgsValue, type AnyArgsValueItem, type Option } from "../public/command.ts";

export class SafeArgs {
	private _schema: Record<string, Option>;
	private _result: Record<string, AnyArgsValue>;
	private _missing: Set<string>;
	private _frozen: boolean;

	constructor(schema: Record<string, Option>) {
		this._schema = schema;
		this._result = {};
		this._missing = new Set;
		this._frozen = false;

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
	private _resultDefine(key: string, value: AnyArgsValue): void {
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

		if (typeof option !== "object") {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			throw new Error(`typeof options['${key}'] is '${option}'`);
		}

		return option;
	}

	set(key: string, value: AnyArgsValue): void {
		if (this._frozen)
			throw new Error("set cannot be called after getFrozenResult");

		const option = this._getSchemaValue(key);

		if (option.array ?? false)
			throw new Error(`Set instead of add used for options['${key}']`);

		validateType(option.type, value);

		this._resultDefine(key, value);
		this._missing.delete(key);
	}

	pushTo(key: string, ...value: AnyArgsValueItem[]): void {
		if (this._frozen)
			throw new Error("pushTo cannot be called after getFrozenResult");

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

	getMissing(): Set<string> {
		return this._missing;
	}

	getFrozenResult(): Readonly<SafeArgs["_result"]> {
		if (!this._frozen) {
			this._frozen = true;

			Object.freeze(this._result);

			for (const key in this._result) {
				if (!Object.hasOwn(this._result, key))
					continue;

				const object = this._result[key];

				if (typeof key !== "object")
					continue;

				Object.freeze(object);
			}
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
		case OptionType.Boolean:
		case OptionType.Flag:
			if (typeof value !== "boolean")
				throw new Error(`typeof value is '${typeof value}'; expected 'boolean'`);

			break;

		case OptionType.Integer:
			if (!Number.isSafeInteger(value))
				throw new Error(`Number.isSafeInteger(value) is false`);

			break;

		case OptionType.Number:
			if (!Number.isFinite(value))
				throw new Error(`Number.isFinite(value) is false`);

			break;

		case OptionType.String:
			if (typeof value !== "string")
				throw new Error(`typeof value is '${typeof value}'; expected 'string'`);

			break;

		case OptionType.Snowflake:
		case OptionType.User:
		case OptionType.Role:
		case OptionType.Channel:
			if (typeof value !== "string")
				throw new Error(`typeof value is '${typeof value}'; expected 'string'`);

			if (!isSnowflake(value))
				throw new Error(`isSnowflake('${value}') is false`);

			break;

		case OptionType.Duration:
			if (typeof value !== "number")
				throw new Error(`typeof value is '${typeof value}'; expected 'number'`);

			break;

		default:
			requireExhaustiveSwitch(type);
			break;
	}
}

