/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Color, Snowflake } from "#common/schema/general.ts";
import { zTemplate, type ZTemplate } from "#common/schema/template.ts";
import type { InferView, m, Shape } from "mousetache";
import { MessageFlags } from "oceanic.js";
import { TomlDate } from "smol-toml";
import { z } from "zod";

type Message<T extends z.ZodType> = z.output<ReturnType<typeof message<T>>>;

function message<T extends z.ZodType>(stringType: (markdown: boolean) => T) {
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

type Embed<T extends z.ZodType> = z.output<ReturnType<typeof embed<T>>>;

function embed<T extends z.ZodType>(stringType: (markdown: boolean) => T) {
	return z.strictObject({
		title: stringType(true),
		description: stringType(true),
		url: stringType(false),
		timestamp: z.instanceof(TomlDate).transform(date => date.toISOString()), // TODO is this filter consistent with Discord's
		color: Color,
		footer: z.strictObject({ text: stringType(false), icon: stringType(false).optional() }),
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

export type MessageTemplate<T extends m.Shape = any> = z.infer<ReturnType<typeof messageTemplate<T>>>;

export function messageTemplate<T extends m.Shape>(shape: T) {
	const result = message(markdown => zTemplate(shape, markdown))
		.transform(template => {
			return {
				render(view: InferView<T>) {
					return renderMessageTemplate(template, view);
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

function renderMessageTemplate<T extends Shape>(template: Message<ZTemplate<T>>, view: InferView<T>) {
	return {
		...template,
		content: template.content?.render(view),
		embeds: template.embeds?.map(embed => applyEmbedTemplate(embed, view)),
	};
}

function applyEmbedTemplate<T extends Shape>(template: Embed<ZTemplate<T>>, view: InferView<T>) {
	const author = template.author !== undefined
		? {
			name: template.author.name.render(view),
			url: template.author.url?.render(view),
			iconURL: template.author.iconURL?.render(view),
		}
		: undefined;

	const fields = template.fields?.map(({ name, value, ...field }) => ({
		name: name?.render(view),
		value: value?.render(view),
		...field
	})).filter(({ value }) => value.length !== 0);

	const footer = template.footer !== undefined
		? {
			text: template.footer.text.render(view),
			icon: template.footer.icon?.render(view),
		}
		: undefined;

	const image = template.image !== undefined
		? { url: template.image.url.render(view) }
		: undefined;

	const thumbnail = template.thumbnail !== undefined
		? { url: template.thumbnail.url.render(view) }
		: undefined;

	return ({
		...template,
		author,
		description: template.description?.render(view),
		fields,
		footer,
		image,
		thumbnail,
		title: template.title?.render(view),
		url: template.url?.render(view)
	});
}
