import { Client, ClientEvents } from "oceanic.js";
import { ALLOWED_GUILDS } from "../config";
import { Command, Plugin } from "./types";

const plugins: Plugin[] = [];
const command_lookup: Map<string, Command[]> = new Map;
const all_commands: Command[] = [];

export function register_plugin(plugin: Plugin): void {
	plugins.push(plugin);

	if (plugin.commands) {
		for (const command of plugin.commands) {
			if (typeof command.id === "string")
				add_command(command.id, command);
			else
				command.id.forEach(id => add_command(id, command));

			all_commands.push(command);
		}
	}
}

export function get_plugins(): Plugin[] {
	return plugins;
}

export function get_commands(name: string): Command[] {
	return command_lookup.get(name) ?? [];
}

export function get_all_commands(): Command[] {
	return all_commands;
}

function add_command(id: string, command: Command): void {
	if (!command_lookup.has(id))
		command_lookup.set(id, []);

	const list = command_lookup.get(id)!;
	list.push(command);
}

export async function apply_plugins(client: Client): Promise<void> {
	for (const plugin of get_plugins()) {
		if (!plugin.listeners)
			continue;

		for (const listener of plugin.listeners) {
			client.on(listener.type, (...args) => {
				let guild: string | null = null;
				if (listener.type in EVENT_TO_GUILD)
					guild ??= EVENT_TO_GUILD[listener.type](...args);

				if (guild !== null && !ALLOWED_GUILDS.has(guild))
					return;

				listener.listener(...args);
			});
		}

		if (plugin.apply)
			await plugin.apply(client);
	}
}


const EVENT_TO_GUILD = define_event_mapping({
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

