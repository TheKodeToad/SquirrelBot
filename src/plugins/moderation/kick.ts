import { DiscordRESTError, JSONErrorCodes, Permissions } from "oceanic.js";
import { escape_all } from "../../common/markdown";
import { get_highest_role } from "../../common/member";
import { format_rest_error, get_member_cached, get_user_cached } from "../../common/rest";
import { FlagType, define_command } from "../../plugin/types";

export const kick_command = define_command({
	id: "kick",

	flags: {
		user: {
			type: FlagType.USER,
			id: "user",
			array: true,
			primary: true,
			required: true,
		},
		reason: {
			type: FlagType.STRING,
			id: "reason",
		},
		dm: {
			type: FlagType.VOID,
			id: "dm",
		},
		no_dm: {
			type: FlagType.VOID,
			id: ["no-dm", "!dm"],
		},
	},

	async run(context, args) {
		if (context.guild === null)
			return;

		if (!context.member?.permissions?.has(Permissions.KICK_MEMBERS))
			return;

		let successful_kicks: { id: string, name: string, dm_sent: boolean; }[] = [];
		let unsuccessful_kicks: { id: string, name: string, error: string; }[] = [];

		for (const id of args.user) {
			let name: string;
			let bot: boolean;

			try {
				const target_member = await get_member_cached(context.client, context.guild, id);
				name = target_member.user.tag;
				bot = target_member.bot;

				try {
					var bot_member = await get_member_cached(context.client, context.guild, context.client.user.id);
				} catch (error) {
					if (!(error instanceof DiscordRESTError))
						throw error;

					unsuccessful_kicks.push({ id, name, error: `Bot member fetch failed: ${format_rest_error(error)}` });
					continue;
				}

				const target_position = get_highest_role(target_member).position;

				if (context.guild.ownerID !== context.user.id
					&& (context.guild.ownerID === id
						|| get_highest_role(context.member).position <= target_position)) {
					unsuccessful_kicks.push({ id, name, error: "Your highest role is not above target's highest role" });
					continue;
				}

				if (context.guild.ownerID !== context.client.user.id
					&& (context.guild.ownerID === id
						|| get_highest_role(bot_member).position <= target_position)
				) {
					unsuccessful_kicks.push({ id, name, error: "Bot's highest role is not above target's highest role" });
					continue;
				}
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				if (error.code !== JSONErrorCodes.UNKNOWN_MEMBER) {
					unsuccessful_kicks.push({ id, name: "<unknown>", error: `Member fetch failed: ${format_rest_error(error)}` });
					continue;
				}

				try {
					const user = await get_user_cached(context.client, id);
					unsuccessful_kicks.push({ id, name: user.tag, error: "User is not in the server" });
					continue;
				} catch (error) {
					if (!(error instanceof DiscordRESTError))
						throw error;

					unsuccessful_kicks.push({ id, name: "<unknown>", error: "User is not in the server" });
					continue;
				}
			}

			let dm_sent = false;

			if (!bot && !args.no_dm) {
				try {
					const dm = await context.client.rest.users.createDM(id);
					await dm.createMessage({ content: "You were kicked :regional_indicator_l:" });
					dm_sent = true;
				} catch (error) {
					if (!(error instanceof DiscordRESTError))
						throw error;
				}
			}

			try {
				await context.guild.removeMember(id, args.reason ?? undefined);
				successful_kicks.push({ id, name, dm_sent });
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				unsuccessful_kicks.push({ id, name, error: format_rest_error(error) });
			}
		}

		if (args.user.length === 1) {
			if (successful_kicks.length === 1) {
				const [kick] = successful_kicks;
				await context.respond(`:white_check_mark: Kicked <@${kick.id}> (${escape_all(kick.name)})${kick.dm_sent ? " with direct message" : ""}!`);
			} else if (unsuccessful_kicks.length === 1) {
				const [kick] = unsuccessful_kicks;
				await context.respond(`:x: Could not kick <@${kick.id}> (${escape_all(kick.name)}): ${kick.error}!`);
			}
		} else {
			const successful_message = successful_kicks.map(kick => `- <@${kick.id}> (${escape_all(kick.name)}) ${kick.dm_sent ? " with direct message" : ""}`).join("\n");
			const unsuccessful_message = unsuccessful_kicks.map(kick => `- <@${kick.id}> (${escape_all(kick.name)}): ${kick.error}`).join("\n");

			if (unsuccessful_kicks.length === 0) {
				await context.respond(
					`:white_check_mark: Kicked all ${args.user.length} users:\n${successful_message}`
				);
			} else if (successful_kicks.length === 0) {
				await context.respond(
					`:x: None of ${args.user.length} users were kicked:\n${unsuccessful_message}`
				);
			} else {
				await context.respond(
					`:warning: Only ${successful_kicks.length} of ${args.user.length} kicks were successful!\n`
					+ `Successful kicks:\n${successful_message}\n`
					+ `Unsuccessful kicks:\n${unsuccessful_message}`
				);
			}
		}
	}
});
