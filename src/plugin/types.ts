import { APIInteractionGuildMember, BaseMessageOptions, Channel, ChatInputCommandInteraction, Client, ClientEvents, Guild, GuildChannel, GuildMember, Message, Snowflake, TextBasedChannel, TextChannel, User, WebSocketShardEventTypes } from "discord.js";

type Id = string | [string, ...string[]];

export interface Plugin {
	id: string;
	commands?: Command[];
	listeners?: EventListener[];
	apply?(client: Client<true>): Promise<void> | void;
}

export function define_plugin(plugin: Plugin): Plugin {
	return plugin;
}

export interface Command<F extends Record<string, Flag> = Record<string, Flag>> {
	id: Id;
	flags?: F;
	support_prefix?: boolean;
	support_slash?: boolean;
	run(args: { [K in keyof F]: FlagValue<F[K]> }, context: Context): Promise<void> | void;
}

export function define_command<F extends Record<string, Flag>>(command: Command<F>): Command<F> {
	return command;
}

export interface Context {
	command: Command;
	client: Client<true>;
	user: User;
	member: GuildMember | null;
	guild: Guild | null;
	channel: TextBasedChannel | null;
	message?: Message;
	interaction?: ChatInputCommandInteraction;
	respond(reply: Reply): Promise<void>;
}

export type Reply = BaseMessageOptions & { ephemeral?: boolean; } | string;

export interface CommandGroup {
	id: Id;
	children: Command<any> | CommandGroup[];
}

export enum FlagType {
	VOID,
	BOOLEAN,
	STRING,
	NUMBER,
	USER,
	ROLE,
	CHANNEL,
	SNOWFLAKE
}

export interface Flag {
	type: FlagType;
	id: Id;
	required?: boolean;
	array?: boolean;
	/** with prefix mode, becomes the unnamed flag */
	primary?: boolean;
};

type FlagValue<F extends Flag> =
	F["array"] extends true ? FlagTypeValue<F["type"]>[] :
	F["required"] extends true ? FlagTypeValue<F["type"]> :
	FlagTypeValue<F["type"]> | null;

export type FlagTypeValue<F extends FlagType> =
	F extends FlagType.VOID ? boolean :
	F extends FlagType.BOOLEAN ? boolean :
	F extends FlagType.STRING ? string :
	F extends FlagType.NUMBER ? number :
	F extends FlagType.USER ? Snowflake :
	F extends FlagType.ROLE ? Snowflake :
	F extends FlagType.CHANNEL ? Snowflake :
	F extends FlagType.SNOWFLAKE ? Snowflake :
	never;

export interface EventListener<E extends keyof EventTypes = keyof EventTypes> {
	type: E;
	listener(...args: EventTypes[E]): Promise<void> | void;
}

export function define_event_listener<E extends keyof EventTypes>(type: E, listener: EventListener<E>["listener"]): EventListener<E> {
	return { type, listener };
}

export type EventTypes = ClientEvents;

export const EVENT_TO_GUILD = define_event_mapping({
	applicationCommandPermissionsUpdate: data => data.guildId,
	autoModerationActionExecution: execution => execution.guild.id,
	autoModerationRuleCreate: rule => rule.guild.id,
	autoModerationRuleDelete: rule => rule.guild.id,
	autoModerationRuleUpdate: (_old_rule, new_rule) => new_rule.guild.id,
	channelCreate: channel => channel.guildId,
	channelDelete: channel => channel instanceof GuildChannel ? channel.guildId : null,
	channelPinsUpdate: (channel, _date) => channel instanceof GuildChannel ? channel.guildId : null,
	channelUpdate: (_old_channel, new_channel) => new_channel instanceof GuildChannel ? new_channel.guildId : null,
	emojiCreate: emoji => emoji.guild.id,
	emojiDelete: emoji => emoji.guild.id,
	emojiUpdate: (_old_emoji, new_emoji) => new_emoji.guild.id,
	guildAuditLogEntryCreate: (_entry, guild) => guild.id,
	guildAvailable: guild => guild.id,
	guildBanAdd: ban => ban.guild.id,
	guildBanRemove: ban => ban.guild.id,
	guildCreate: guild => guild.id,
	guildDelete: guild => guild.id,
	guildUnavailable: guild => guild.id,
	guildIntegrationsUpdate: guild => guild.id,
	guildMemberAdd: member => member.guild.id,
	guildMemberAvailable: member => member.guild.id,
	guildMemberRemove: member => member.guild.id,
	guildMembersChunk: (_members, guild, _data) => guild.id,
	guildMemberUpdate: (_old_member, new_member) => new_member.guild.id,
	guildUpdate: (_old_guild: Guild, new_guild: Guild) => new_guild.id,
	inviteCreate: invite => invite.guild?.id ?? null,
	inviteDelete: invite => invite.guild?.id ?? null,
	messageCreate: message => message.guildId,
	messageDelete: message => message.guildId,
	messageReactionRemoveAll: (message, _reactions) => message.guildId,
	messageReactionRemoveEmoji: reaction => reaction.message.guildId,
	messageDeleteBulk: (_messages, channel) => channel.guildId,
	messageReactionAdd: (reaction, _user) => reaction.message.guildId,
	messageReactionRemove: (reaction, _user) => reaction.message.guildId,
	messageUpdate: (_old_message, new_message) => new_message.guildId,
	presenceUpdate: (_old_precense, new_precense) => new_precense.guild?.id ?? null,
	roleCreate: role => role.guild.id,
	roleDelete: role => role.guild.id,
	roleUpdate: (_old_role, new_role) => new_role.guild.id,
	threadCreate: (thread, _newly_created) => thread.guildId,
	threadDelete: thread => thread.guildId,
	threadListSync: (_threads, guild) => guild.id,
	threadMemberUpdate: (_old_member, new_member) => new_member.guildMember?.id ?? null,
	threadMembersUpdate: (_added_members, _removed_members, thread) => thread.id,
	threadUpdate: (_old_thread, new_thread) => new_thread.guildId,
	typingStart: typing => typing.guild?.id ?? null,
	voiceStateUpdate: (_old_state, new_state) => new_state.guild.id,
	webhookUpdate: channel => channel.guildId,
	webhooksUpdate: channel => channel.guildId,
	interactionCreate: interaction => interaction.guildId,
	stageInstanceCreate: stage_instance => stage_instance.guildId,
	stageInstanceUpdate: (_old_stage_instance, new_stage_instance) => new_stage_instance.guildId,
	stageInstanceDelete: stage_instance => stage_instance.guildId,
	stickerCreate: sticker => sticker.guildId,
	stickerDelete: sticker => sticker.guildId,
	stickerUpdate: (_old_sticker, new_sticker) => new_sticker.guildId,
	guildScheduledEventCreate: event => event.guildId,
	guildScheduledEventUpdate: (_old_event, new_event) => new_event.guildId,
	guildScheduledEventDelete: event => event.guildId,
	guildScheduledEventUserAdd: (event, _user) => event.guildId,
	guildScheduledEventUserRemove: (event, _user) => event.guildId
});

function define_event_mapping<E extends {
	[E in keyof EventTypes]?: (...args: EventTypes[E]) => string | null;
}>(mapping: E) {
	return mapping;
}
