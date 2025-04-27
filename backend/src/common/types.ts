import type { BaseIssue, BaseSchema } from "valibot";

export type SchemaWithOutput<O> = BaseSchema<unknown, O, BaseIssue<unknown>>;

/**
 * If there is an error on this function's argument there are switch cases missing
 */
export function requireExhaustiveSwitch(_value: never): void { }
