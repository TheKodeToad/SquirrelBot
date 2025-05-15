/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { parseTemplate, type TemplateSchema } from "#common/template/index.ts";
import { pipe, rawTransform, string } from "valibot";

export function template<S extends TemplateSchema>(schema: S) {
	return pipe(string(), rawTransform(({ dataset, addIssue, NEVER }) => {
		if (!dataset.typed)
			return NEVER;

		const template = parseTemplate(dataset.value, schema);

		if (typeof template === "string") {
			addIssue({ message: template });
			return NEVER;
		}

		return template;
	}));
}
