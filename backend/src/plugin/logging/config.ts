import { Snowflake } from "#common/schema/general.ts";
import { messageTemplate } from "#common/schema/message.ts";
import { ParameterType } from "#common/template/index.ts";
import { z } from "zod/v4";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function eventConfig<Z extends z.ZodObject>(object: Z, defaultObject: z.input<Z>) {
	const defaultTransformed = object.parse(defaultObject);

	return z.union([
		z.boolean(),
		object,
	]).optional().transform(input => input === true ? defaultTransformed : (input ?? false));
}

const messageLogParams = {
	author: ParameterType.User,
	author_avatar: ParameterType.RawString,
} as const;

export const LoggingConfig = z.strictObject({
	loggers: z.strictObject({
		channel: Snowflake,
		// for now you can't customise each event
		events: z.strictObject({
			message_edit: eventConfig(
				z.strictObject({
					message: messageTemplate({
						...messageLogParams,
						old_content: ParameterType.MarkdownString,
						new_content: ParameterType.MarkdownString
					})
				}),
				{
					message: {
						embeds: [{
							title: "Message Edited",
							author: { name: "{{author#tag}}", icon_url: "{{author_avatar}}" },
							fields: [
								{ name: "Old Content", value: "{{old_content}}", },
								{ name: "New Content", value: "{{new_content}}", }
							],
							color: "yellow",
						}]
					}
				},
			),

			message_delete: eventConfig(
				z.strictObject({
					message: messageTemplate({ ...messageLogParams, content: ParameterType.MarkdownString })
				}),
				{
					message: {
						embeds: [{
							title: "Message Deleted",
							author: { name: "{{author#tag}}", icon_url: "{{author_avatar}}" },
							fields: [
								{ name: "Content", value: "{{content}}", }
							],
							color: "red",
						}]
					}
				},
			),
		}).describe("Customize what happens when events happen in the server — set them to true to use the default presentation")
	}).array().describe("Specify logging for channels")
});
