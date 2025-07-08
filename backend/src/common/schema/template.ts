/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { parseTemplate, type TemplateSchema } from "#common/template/index.ts";
import { z } from "zod/v4";

export function template<S extends TemplateSchema>(schema: S) {
	return z.string().transform((input, context) => {
		const result = parseTemplate(input, schema);

		if (typeof result === "string") {
			context.addIssue({ message: result });
			return z.NEVER;
		}

		return result;
	});
}
