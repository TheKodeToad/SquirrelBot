import {
	Channel,
	ChannelTypes,
	MessageTypes,
	TextableChannelTypes,
	TextableGuildChannelTypes,
	ThreadChannelTypes,
	UndeletableMessageTypes,
	type AnyTextableChannel,
	type AnyTextableGuildChannel,
	type AnyThreadChannel,
	type TextableChannels,
	type TextableGuildChannels,
	type ThreadChannels,
} from "oceanic.js";

export function isThreadChannel(channel: Channel): channel is AnyThreadChannel {
	return isThreadChannelType(channel.type);
}

export function isThreadChannelType(
	type: ChannelTypes,
): type is ThreadChannels {
	return ThreadChannelTypes.includes(type as ThreadChannels);
}

export function isTextableChannel(
	channel: Channel,
): channel is AnyTextableChannel {
	return isTextableChannelType(channel.type);
}

export function isTextableChannelType(
	type: ChannelTypes,
): type is TextableChannels {
	return TextableChannelTypes.includes(type as TextableChannels);
}

export function isTextableGuildChannel(
	channel: Channel,
): channel is AnyTextableGuildChannel {
	return isTextableGuildChannelType(channel.type);
}

export function isTextableGuildChannelType(
	type: ChannelTypes,
): type is TextableGuildChannels {
	return TextableGuildChannelTypes.includes(type as TextableGuildChannels);
}

export function isUndeletableMessageType(
	type: MessageTypes,
): type is (typeof UndeletableMessageTypes)[number] {
	return UndeletableMessageTypes.includes(
		type as (typeof UndeletableMessageTypes)[number],
	);
}
