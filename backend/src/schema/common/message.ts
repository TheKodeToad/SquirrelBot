/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { ParameterRecord, TemplateSchema } from "#common/template/index.ts";
import { HexColor, Snowflake } from "#schema/common/general.ts";
import { template } from "#schema/common/template.ts";
import { MessageFlags } from "oceanic.js";
import { TomlDate } from "smol-toml";
import { array, boolean, instance, maxLength, object, optional, pipe, string, transform, union, type BaseIssue, type BaseSchema, type InferOutput } from "valibot";

export const MessageLiteral = message(string());
export type MessageLiteral = InferOutput<typeof MessageLiteral>;

export function messageTemplate<S extends TemplateSchema>(schema: S) {
	return pipe(
		message(template(schema)),
		transform(({ content, embeds, ...message }) => (params: ParameterRecord<S>) => ({
			content: content?.(params),
			embeds: embeds?.map(
				({ author, description, fields, footer, image, thumbnail, title, url, ...embed }) => ({
					author: author !== undefined
						? {
							name: author.name(params),
							url: author.url?.(params),
							iconURL: author.iconURL?.(params),
						}
						: undefined,
					description: description?.(params),
					fields: fields?.map(({ name, value, ...field }) => ({
						name: name?.(params),
						value: value?.(params),
						...field
					})) ?? [],
					footer: footer !== undefined
						? { text: footer.text(params), icon: footer.icon(params) }
						: undefined,
					image: image !== undefined ? { url: image.url(params) } : undefined,
					thumbnail: thumbnail !== undefined ? { url: thumbnail.url(params) } : undefined,
					title: title?.(params),
					url: url?.(params),
					...embed
				})
			) ?? [],
			...message
		}))
	);
}

function message<S extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(stringSchema: S) {
	return pipe(
		object({
			content: optional(stringSchema),
			allowed_mentions: optional(pipe(
				optional(object({
					everyone: optional(boolean()),
					replied_user: optional(boolean()),
					users: optional(union(
						[
							boolean(),
							pipe(array(Snowflake), maxLength(100))
						]
					)),
					roles: optional(union(
						[
							boolean(),
							pipe(array(Snowflake), maxLength(100))
						]
					)),
				}), {}),
				transform(({ replied_user, ...input }) => ({ repliedUser: replied_user, ...input }))
			), {}),
			embeds: optional(array(embed(stringSchema))),
			silent: optional(boolean())
		}),
		transform(({ allowed_mentions, silent, ...input }) => ({
			allowedMentions: allowed_mentions,
			flags: silent ? MessageFlags.SUPPRESS_NOTIFICATIONS : 0,
			...input
		}))
	);
}

function embed<S extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(stringSchema: S) {
	return object({
		title: optional(stringSchema),
		description: optional(stringSchema),
		url: optional(stringSchema),
		timestamp: optional(pipe(instance(TomlDate), transform(date => date.toISOString()))), // TODO is this filter consistent with Discord's
		color: optional(HexColor),
		footer: optional(object({ text: stringSchema, icon: stringSchema })),
		image: optional(pipe(stringSchema, transform(url => ({ url })))),
		thumbnail: optional(pipe(stringSchema, transform(url => ({ url })))),
		author: optional(pipe(object({
			name: stringSchema,
			url: optional(stringSchema),
			icon_url: optional(stringSchema)
		}), transform(({ icon_url, ...input }) => ({ iconURL: icon_url, ...input })))),
		fields: optional(array(object({
			name: stringSchema,
			value: stringSchema,
			inline: boolean()
		})))
	});
}

