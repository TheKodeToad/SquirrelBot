import { DiscordRESTError, Guild, Member, PrivateChannel, User } from "oceanic.js";
import { client } from "..";

export function format_rest_error(rest_error: DiscordRESTError) {
	if (rest_error.resBody !== null
		&& typeof rest_error.resBody.message === "string") {
		return `API Error ${rest_error.code}: ${rest_error.resBody.message}`;
	}

	return `HTTP Error ${rest_error.status}: ${rest_error.statusText}`;
}

export function get_user_cached(user_id: string): User | Promise<User> {
	return client.users.get(user_id) ?? client.rest.users.get(user_id);
}

export function get_member_cached(guild: Guild, user_id: string): Member | Promise<Member> {
	return guild.members.get(user_id) ?? client.rest.guilds.getMember(guild.id, user_id);
}

export function create_dm_cached(user_id: string): PrivateChannel | Promise<PrivateChannel> {
	return client.privateChannels.find(channel => channel.recipient.id === user_id) ?? client.rest.users.createDM(user_id);
}
