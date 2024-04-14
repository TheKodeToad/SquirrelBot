import { AnnouncementChannel, AnnouncementThreadChannel, AnyGuildChannelWithoutThreads, AnyInteractionChannel, AnyInteractionGateway, AnyInviteChannel, AnyTextableChannel, AnyTextableGuildChannel, AnyThreadChannel, AnyVoiceChannel, AuditLogEntry, AutoModerationActionExecution, AutoModerationRule, CategoryChannel, Channel, Client, ClientEvents, CreateMessageOptions, DeletedPrivateChannel, Entitlement, ForumChannel, GroupChannel, Guild, GuildApplicationCommandPermissions, GuildEmoji, GuildScheduledEvent, Integration, Invite, JSONAnnouncementChannel, JSONAnnouncementThreadChannel, JSONAutoModerationRule, JSONCategoryChannel, JSONEntitlement, JSONGuild, JSONIntegration, JSONMember, JSONMessage, JSONPrivateThreadChannel, JSONPublicThreadChannel, JSONRole, JSONScheduledEvent, JSONStageChannel, JSONStageInstance, JSONTestEntitlement, JSONTextChannel, JSONThreadOnlyChannel, JSONUser, JSONVoiceChannel, JSONVoiceState, Member, Message, MinimalPossiblyUncachedThread, PartialEmoji, PossiblyUncachedIntegration, PossiblyUncachedInvite, PossiblyUncachedMessage, PossiblyUncachedThread, Presence, PrivateChannel, PrivateThreadChannel, PublicThreadChannel, RawRequest, Role, StageChannel, StageInstance, Sticker, TestEntitlement, TextChannel, TextableChannel, ThreadMember, UnavailableGuild, Uncached, UncachedThreadMember, User, VoiceChannel, VoiceChannelEffect } from "oceanic.js";

type Id = string | [string, ...string[]];

export interface Plugin {
	id: string;
	commands?: Command[];
	listeners?: EventListener[];
	apply?(client: Client): Promise<void> | void;
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
	client: Client;
	user: User;
	member: Member | null;
	guild: Guild | null;
	channel: AnyTextableChannel | AnyInteractionChannel | null;
	message?: Message;
	respond(reply: Reply): Promise<void>;
}

export type Reply = Omit<CreateMessageOptions, "messageReference" | "tts"> & { ephemeral?: boolean; } | string;

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
	F extends FlagType.USER ? string :
	F extends FlagType.ROLE ? string :
	F extends FlagType.CHANNEL ? string :
	F extends FlagType.SNOWFLAKE ? string :
	never;

export interface EventListener<E extends keyof ClientEvents = keyof ClientEvents> {
	type: E;
	listener(...args: ClientEvents[E]): Promise<void> | void;
}

export function define_event_listener<E extends keyof ClientEvents>(type: E, listener: EventListener<E>["listener"]): EventListener<E> {
	return { type, listener };
}

export const EVENT_TO_GUILD = define_event_mapping({
	applicationCommandPermissionsUpdate: guild => guild.id,
	autoModerationActionExecution: guild => guild.id,
	autoModerationRuleCreate: rule => rule.guildID,
	autoModerationRuleDelete: rule => rule.guildID,
	autoModerationRuleUpdate: rule => rule.guildID,
	channelCreate: channel => "guildID" in channel ? channel.guildID : null,
	channelDelete: channel => "guildID" in channel ? channel.guildID : null,
	channelPinsUpdate: channel => "guildID" in channel ? channel.guildID : null,
	channelUpdate: (...[channel]) => channel.guildID,
	entitlementCreate: entitlement => entitlement.guildID,
	entitlementDelete: entitlement => entitlement.guildID,
	entitlementUpdate: entitlement => entitlement.guildID,
	guildAuditLogEntryCreate: guild => guild.id,
	guildAvailable: guild => guild.id,
	guildBanAdd: guild => guild.id,
	guildBanRemove: guild => guild.id,
	guildCreate: guild => guild.id,
	guildDelete: guild => guild.id,
	guildEmojisUpdate: guild => guild.id,
	guildIntegrationsUpdate: guild => guild.id,
	guildMemberAdd: member => member.guildID,
	guildMemberChunk: members => members[0]?.guildID ?? null,
	guildMemberRemove: (_member, guild) => guild.id,
	guildMemberUpdate: member => member.guildID,
	guildRoleCreate: role => role.guildID,
	guildRoleDelete: (_role, guild) => guild.id,
	guildRoleUpdate: role => role.guildID,
	guildScheduledEventCreate: event => event.guildID,
	guildScheduledEventDelete: event => event.guildID,
	guildScheduledEventUpdate: event => event.guildID,
	guildScheduledEventUserAdd: () => {
		throw new Error("Function not implemented.");
	},
	guildScheduledEventUserRemove: () => {
		throw new Error("Function not implemented.");
	},
	guildStickersUpdate: guild => guild.id,
	guildUnavailable: guild => guild.id,
	guildUpdate: guild => guild.id,
	integrationCreate: guild => guild.id,
	integrationDelete: guild => guild.id,
	integrationUpdate: guild => guild.id,
	interactionCreate: interaction => interaction.guildID,
	inviteCreate: invite => invite.guildID,
	inviteDelete: invite => invite.guild?.id ?? null,
	messageCreate: message => message.guildID,
	messageDelete: message => message.guildID ?? null,
	messageDeleteBulk: messages => messages[0].guildID ?? null,
	messageReactionAdd: message => message.guildID ?? null,
	messageReactionRemove: message => message.guildID ?? null,
	messageReactionRemoveAll: message => message.guildID ?? null,
	messageReactionRemoveEmoji: message => message.guildID ?? null,
	messageUpdate: message => message.guildID,
	presenceUpdate: guild => guild.id,
	stageInstanceCreate: instance => instance.guildID,
	stageInstanceDelete: instance => instance.guildID,
	stageInstanceUpdate: instance => instance.guildID,
	threadCreate: thread => thread.guildID,
	threadDelete: thread => thread.guildID,
	threadListSync: threads => threads[0]?.guildID ?? null,
	threadMemberUpdate: thread => thread.guildID,
	threadMembersUpdate: thread => thread.guildID,
	threadUpdate: (...[thread]) => thread.guildID,
	typingStart: (...[channel]) => "guildID" in channel ? channel.guildID : null,
	unavailableGuildCreate: guild => guild.id,
	voiceChannelEffectSend: channel => channel.guild.id,
	voiceChannelJoin: member => member.guildID,
	voiceChannelLeave: member => member.guildID,
	voiceChannelStatusUpdate: channel => "guildID" in channel ? channel.guildID : null,
	voiceChannelSwitch: member => member.guildID,
	voiceStateUpdate: member => member.guildID,
	webhooksUpdate: guild => guild.id
});

function define_event_mapping<E extends {
	[E in keyof ClientEvents]?: (...args: ClientEvents[E]) => string | null;
}>(mapping: E) {
	return mapping;
}
