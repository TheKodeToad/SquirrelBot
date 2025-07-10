/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Color, Snowflake } from "#common/schema/general.ts";
import { template } from "#common/schema/template.ts";
import type { ParameterRecord, TemplateSchema } from "#common/template/index.ts";
import { MessageFlags } from "oceanic.js";
import { TomlDate } from "smol-toml";
import { z } from "zod/v4";

export const MessageLiteral = message(z.string());
export type MessageLiteral = z.infer<typeof MessageLiteral>;

export function messageTemplate<S extends TemplateSchema>(schema: S) {
	return message(template(schema))
		.transform(({ content, embeds, ...message }) => (params: ParameterRecord<S>) => ({
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
		}));
}

function message<Z extends z.ZodTypeAny>(stringType: Z) {
	return z.strictObject({
		content: stringType,
		allowed_mentions: z.strictObject({
			everyone: z.boolean(),
			replied_user: z.boolean(),
			users: z.union([z.boolean(), Snowflake.array().max(100)]),
			roles: z.union([z.boolean(), Snowflake.array().max(100)]),
		}).partial().transform(({ replied_user, ...input }) => ({
			epliedUser: replied_user, ...input
		})),
		embeds: embed(stringType).array(),
		silent: z.boolean(),
	}).partial().transform(({ allowed_mentions, silent, ...input }) => ({
		allowedMentions: allowed_mentions,
		flags: silent ? MessageFlags.SUPPRESS_NOTIFICATIONS : 0,
		...input
	}));
}

function embed<Z extends z.ZodType>(stringType: Z) {
	return z.strictObject({
		title: stringType,
		description: stringType,
		url: stringType,
		timestamp: z.instanceof(TomlDate).transform(date => date.toISOString()), // TODO is this filter consistent with Discord's
		color: Color,
		footer: z.strictObject({ text: stringType, icon: stringType }),
		image: stringType.transform(url => ({ url })),
		thumbnail: stringType.transform(url => ({ url })),
		author: z.strictObject({
			name: stringType,
			url: stringType.optional(),
			icon_url: stringType.optional(),
		}).transform(({ icon_url, ...input }) => ({ iconURL: icon_url, ...input })),
		fields: z.strictObject({
			name: stringType,
			value: stringType,
			inline: z.boolean().optional(),
		}).array(),
	}).partial();
}

