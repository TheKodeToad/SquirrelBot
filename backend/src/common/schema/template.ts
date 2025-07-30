/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { parseTemplate, type TemplateSchema } from "#common/template/index.ts";
import { z } from "zod/v4";

export type Template<S extends TemplateSchema> = ReturnType<typeof template<S>>;

export function template<S extends TemplateSchema>(schema: S, allowEscape = true) {
	return z.string().transform((input, context) => {
		const result = parseTemplate(input, schema, allowEscape);

		if (typeof result === "string") {
			context.addIssue({ message: result });
			return z.NEVER;
		}

		return result;
	});
}
