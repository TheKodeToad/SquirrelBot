import { moduleLogger } from "#common/logger/index.ts";
import { bot } from "#discord/index.ts";
import { isGuildAllowed } from "#plugin/core/guildInfoSync.ts";
import type { ClientEvents } from "oceanic.js";

const logger = moduleLogger();

export function wrapListener<E extends keyof ClientEvents>(
	event: E,
	listener: (...args: ClientEvents[E]) => void | Promise<void>
) {
	return async (...args: ClientEvents[E]) => {
		let guild: string | null = null;

		if (Object.hasOwn(EVENT_TO_GUILD, event))
			guild ??= EVENT_TO_GUILD[event](...args);

		if (guild !== null && !isGuildAllowed(guild)) {
			logger.debug?.(`Filtering out event '${event}' from disallowed guild ${guild}`);
			return;
		}

		try {
			await listener(...args);
		} catch (error) {
			logger.error?.(`Error handling event "${event}"`, error);
		}
	};
}

export function installWrappedListener<E extends keyof ClientEvents>(
	event: E,
	listener: (...args: ClientEvents[E]) => void | Promise<void>
): void {
	bot.on(event, wrapListener(event, listener));
}

const EVENT_TO_GUILD: {
	[E in keyof ClientEvents]: (...args: ClientEvents[E]) => string | null;
} = {
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
	messageDeleteBulk: messages => messages[0]?.guildID ?? null,
	messagePollVoteAdd: message => message.guildID ?? null,
	messagePollVoteRemove: message => message.guildID ?? null,
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
	threadDelete: thread => thread.guildID ?? null,
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
	webhooksUpdate: guild => guild.id,
	guildSoundboardSoundCreate: sound => sound.guildID ?? null,
	guildSoundboardSoundDelete: sound => "guildID" in sound ? (sound.guildID ?? null) : null,
	guildSoundboardSoundUpdate: sound => sound.guildID ?? null,
	guildSoundboardSoundsUpdate: (_sounds, _newSounds, guildID) => guildID ?? null,
	soundboardSounds: guildID => guildID,

	connect: () => null,
	debug: () => null,
	disconnect: () => null,
	error: () => null,
	hello: () => null,
	packet: () => null,
	ready: () => null,
	request: () => null,
	shardDisconnect: () => null,
	shardPreReady: () => null,
	shardReady: () => null,
	shardResume: () => null,
	userUpdate: () => null,
	warn: () => null,
};
