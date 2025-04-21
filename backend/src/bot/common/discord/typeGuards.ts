import { Channel, ChannelTypes, MessageTypes, TextableChannelTypes, ThreadChannelTypes, UndeletableMessageTypes, type AnyTextableChannel, type AnyThreadChannel, type TextableChannels, type ThreadChannels } from "oceanic.js";

export function isThreadChannel(channel: Channel): channel is AnyThreadChannel {
	return isThreadChannelType(channel.type);
}

export function isThreadChannelType(type: ChannelTypes): type is ThreadChannels {
	return ThreadChannelTypes.includes(type as ThreadChannels);
}

export function isTextableChannel(channel: Channel): channel is AnyTextableChannel {
	return isTextableChannelType(channel.type);
}

export function isTextableChannelType(type: ChannelTypes): type is TextableChannels {
	return TextableChannelTypes.includes(type as TextableChannels);
}

export function isUndeletableMessageType(type: MessageTypes): type is typeof UndeletableMessageTypes[number] {
	return UndeletableMessageTypes.includes(type as typeof UndeletableMessageTypes[number]);
}
