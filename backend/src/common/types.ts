import type { BaseIssue, BaseSchema } from "valibot";

export type SchemaWithOutput<O> = BaseSchema<unknown, O, BaseIssue<unknown>>;