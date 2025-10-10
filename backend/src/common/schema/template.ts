/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { escapeMarkdown } from "#common/discord/markdown.ts";
import { compileTemplate, TemplateCompileError, TemplateParseError, type Shape } from "mousetache";
import { z } from "zod/v4";

export type ZTemplate<T extends Shape> = ReturnType<typeof zTemplate<T>>;

export function zTemplate<T extends Shape>(shape: T, allowEscape = true) {
	return z.string().transform((input, context) => {
		try {
			const tmpl = compileTemplate(input, shape, {
				fallbackValue: "",
				escape: allowEscape ? value => escapeMarkdown(String(value)) : undefined,
			});
			console.log(tmpl.getSource());
			return tmpl;
		} catch (error) {
			if (!(error instanceof TemplateCompileError || error instanceof TemplateParseError))
				throw error;

			context.addIssue({ message: error.message });
			return z.NEVER;
		}
	});
}
