import { MessageFlags } from "oceanic.js";
import { TomlDate } from "smol-toml";
import { array, boolean, instance, maxLength, object, optional, pipe, string, transform, union, type InferOutput } from "valibot";
import { colorSchema, snowflakeSchema } from "./index.ts";

export const embedSchema = object({
	title: optional(string()),
	description: optional(string()),
	url: optional(string()),
	timestamp: optional(pipe(instance(TomlDate), transform(date => date.toISOString()))), // TODO is this filter consistent with Discord's
	color: optional(colorSchema),
	footer: optional(object({
		text: string(),
		icon: string()
	})),
	image: optional(pipe(string(), transform(url => ({ url })))),
	thumbnail: optional(pipe(string(), transform(url => ({ url })))),
	author: optional(pipe(object({
		name: string(),
		url: optional(string()),
		icon_url: optional(string())
	}), transform(({ icon_url, ...input }) => ({ iconURL: icon_url, ...input })))),
	fields: optional(array(object({
		name: string(),
		value: string(),
		inline: boolean()
	})))
});

export const messageSchema = pipe(
	object({
		content: optional(pipe(string(), maxLength(2000))),
		allowed_mentions: optional(pipe(
			optional(object({
				everyone: optional(boolean()),
				replied_user: optional(boolean()),
				users: optional(union(
					[
						boolean(),
						pipe(array(snowflakeSchema), maxLength(100))
					]
				)),
				roles: optional(union(
					[
						boolean(),
						pipe(array(snowflakeSchema), maxLength(100))
					]
				)),
			}), {}),
			transform(({ replied_user, ...input }) => ({ repliedUser: replied_user, ...input }))
		), {}),
		embeds: optional(array(embedSchema)),
		silent: optional(boolean())
	}),
	transform(({ allowed_mentions, silent, ...input }) => ({
		allowedMentions: allowed_mentions,
		flags: silent ? MessageFlags.SUPPRESS_NOTIFICATIONS : 0,
		...input
	}))
);

export interface Message extends InferOutput<typeof messageSchema> { }
export interface Embed extends InferOutput<typeof embedSchema> { }
