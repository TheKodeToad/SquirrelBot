/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Color, Snowflake } from "#common/schema/general.ts";
import { template, type Template } from "#common/schema/template.ts";
import type { ParameterRecord, TemplateSchema } from "#common/template/index.ts";
import { MessageFlags } from "oceanic.js";
import { TomlDate } from "smol-toml";
import { z } from "zod/v4";

type Message<Z extends z.ZodType> = z.output<ReturnType<typeof message<Z>>>;

function message<Z extends z.ZodType>(stringType: (markdown: boolean) => Z) {
	return z.strictObject({
		content: stringType(true),
		allowed_mentions: z.strictObject({
			everyone: z.boolean(),
			replied_user: z.boolean(),
			users: z.union([z.boolean(), Snowflake.array().max(100)]),
			roles: z.union([z.boolean(), Snowflake.array().max(100)]),
		}).partial().transform(({ replied_user, ...input }) => ({
			repliedUser: replied_user, ...input
		})),
		embeds: embed(stringType).array(),
		silent: z.boolean(),
	}).partial().transform(({ allowed_mentions, silent, ...input }) => ({
		allowedMentions: allowed_mentions,
		flags: silent ? MessageFlags.SUPPRESS_NOTIFICATIONS : 0,
		...input
	}));
}

type Embed<Z extends z.ZodType> = z.output<ReturnType<typeof embed<Z>>>;

function embed<Z extends z.ZodType>(stringType: (markdown: boolean) => Z) {
	return z.strictObject({
		title: stringType(true),
		description: stringType(true),
		url: stringType(false),
		timestamp: z.instanceof(TomlDate).transform(date => date.toISOString()), // TODO is this filter consistent with Discord's
		color: Color,
		footer: z.strictObject({ text: stringType(false), icon: stringType(false) }),
		image: stringType(false).transform(url => ({ url })),
		thumbnail: stringType(false).transform(url => ({ url })),
		author: z.strictObject({
			name: stringType(false),
			url: stringType(false).optional(),
			icon_url: stringType(false).optional(),
		}).transform(({ icon_url, ...input }) => ({ iconURL: icon_url, ...input })),
		fields: z.strictObject({
			name: stringType(true),
			value: stringType(true),
			inline: z.boolean().optional(),
		}).array(),
	}).partial();
}

export const MessageLiteral = message(() => z.string());
export type MessageLiteral = z.infer<typeof MessageLiteral>;

export function messageTemplate<S extends TemplateSchema>(schema: S) {
	const result = message(markdown => template(schema, markdown))
		.transform(template => {
			return {
				apply(params: ParameterRecord<S>) {
					return applyMessageTemplate(template, params);
				}
			};
		});

	// @ts-expect-error avoid parsing constantly
	result.prefault = content => {
		const parsed = result.parse(content);
		return result.default(parsed);
	};

	return result;
}

function applyMessageTemplate<S extends TemplateSchema>(template: Message<Template<S>>, params: ParameterRecord<S>) {
	return {
		...template,
		content: template.content?.apply(params),
		embeds: template.embeds?.map(embed => applyEmbedTemplate(embed, params)),
	};
}

function applyEmbedTemplate<S extends TemplateSchema>(template: Embed<Template<S>>, params: ParameterRecord<S>) {
	const author = template.author !== undefined
		? {
			name: template.author.name.apply(params),
			url: template.author.url?.apply(params),
			iconURL: template.author.iconURL?.apply(params),
		}
		: undefined;

	const fields = template.fields?.map(({ name, value, ...field }) => ({
		name: name?.apply(params),
		value: value?.apply(params),
		...field
	}));

	const footer = template.footer !== undefined
		? {
			text: template.footer.text.apply(params),
			icon: template.footer.icon.apply(params),
		}
		: undefined;

	const image = template.image !== undefined
		? { url: template.image.url.apply(params) }
		: undefined;

	const thumbnail = template.thumbnail !== undefined
		? { url: template.thumbnail.url.apply(params) }
		: undefined;

	return ({
		...template,
		author,
		description: template.description?.apply(params),
		fields,
		footer,
		image,
		thumbnail,
		title: template.title?.apply(params),
		url: template.url?.apply(params)
	});
}
