import { DiscordRESTError, JSONErrorCodes, Permissions } from "oceanic.js";
import { bot } from "../../..";
import { create_dm_cached, format_rest_error, get_highest_role, get_member_cached, get_user_cached } from "../../../common/discord";
import { escape_all } from "../../../common/markdown";
import { OptionType, define_command } from "../../../core/types/command";
import { CaseType, create_case } from "../common/case";

export const ban_command = define_command({
	id: "ban",
	options: {
		user: {
			type: OptionType.USER,
			id: ["user", "u"],
			array: true,
			required: true,
			position: 0,
		},
		reason: {
			type: OptionType.STRING,
			id: ["reason", "r"],
			position: 1,
		},
		dm: {
			type: OptionType.VOID,
			id: ["dm", "d"],
		},
		no_dm: {
			type: OptionType.VOID,
			id: ["no-dm", "nd"],
		},
		purge: {
			type: OptionType.NUMBER,
			id: ["purge", "p", "delete"],
		},
	},
	async run(context, args) {
		if (context.guild === null)
			return;

		if (!context.member?.permissions.has(Permissions.BAN_MEMBERS))
			return;

		const delete_message_seconds = (args.purge ?? 0) * (1000 * 60 * 60 * 24);

		let successful_bans: { case_number: number, id: string, name: string, dm_sent: boolean; }[] = [];
		let unsuccessful_bans: { id: string, name: string, error: string; }[] = [];

		for (const id of args.user) {
			let name: string;
			let in_guild: boolean;
			let is_bot: boolean;

			try {
				const target_member = await get_member_cached(context.guild, id);
				name = target_member.user.tag;
				in_guild = true;
				is_bot = target_member.bot;

				try {
					var bot_member = await get_member_cached(context.guild, bot.user.id);
				} catch (error) {
					if (!(error instanceof DiscordRESTError))
						throw error;

					unsuccessful_bans.push({ id, name, error: `Bot member fetch failed: ${format_rest_error(error)}` });
					continue;
				}

				const target_position = get_highest_role(target_member).position;

				if (context.guild.ownerID !== context.user.id
					&& (context.guild.ownerID === id
						|| get_highest_role(context.member).position <= target_position)) {
					unsuccessful_bans.push({ id, name, error: "Your highest role is not above target's highest role" });
					continue;
				}

				if (context.guild.ownerID !== bot.user.id
					&& (context.guild.ownerID === id
						|| get_highest_role(bot_member).position <= target_position)
				) {
					unsuccessful_bans.push({ id, name, error: "Bot's highest role is not above target's highest role" });
					continue;
				}
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				if (error.code !== JSONErrorCodes.UNKNOWN_MEMBER) {
					unsuccessful_bans.push({ id, name: "<unknown>", error: `Member fetch failed: ${format_rest_error(error)}` });
					continue;
				}

				try {
					const user = await get_user_cached(id);
					name = user.tag;
					in_guild = false;
					is_bot = user.bot;
				} catch (error) {
					if (!(error instanceof DiscordRESTError))
						throw error;

					unsuccessful_bans.push({ id, name: "<unknown>", error: `User fetch failed: ${format_rest_error(error)}` });
					continue;
				}
			}

			let dm_sent = false;

			if (in_guild && !is_bot && !args.no_dm) {
				try {
					const dm = await create_dm_cached(id);
					await dm.createMessage({ content: "You were banned :regional_indicator_l:" });
					dm_sent = true;
				} catch (error) {
					if (!(error instanceof DiscordRESTError))
						throw error;
				}
			}

			try {
				await context.guild.createBan(id, {
					reason: args.reason ?? undefined,
					deleteMessageSeconds: delete_message_seconds,
				});
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				unsuccessful_bans.push({ id, name, error: format_rest_error(error) });
				continue;
			}

			const case_number = await create_case(context.guild.id, {
				type: CaseType.BAN,
				actor_id: context.user.id,
				target_id: id,
				reason: args.reason ?? undefined,
				delete_message_seconds,
				dm_sent,
			});

			successful_bans.push({ case_number, id, name, dm_sent });
		}

		if (args.user.length === 1) {
			if (successful_bans.length === 1) {
				const ban = successful_bans[0]!;
				await context.respond(`:white_check_mark: Banned <@${ban.id}> (${escape_all(ban.name)})${ban.dm_sent ? " with direct message" : ""} [#${ban.case_number}]!`);
			} else if (unsuccessful_bans.length === 1) {
				const ban = unsuccessful_bans[0]!;
				await context.respond(`:x: Could not ban <@${ban.id}> (${escape_all(ban.name)}): ${ban.error}!`);
			}
		} else {
			const successful_message = successful_bans.map(ban => `- <@${ban.id}> (${escape_all(ban.name)})${ban.dm_sent ? " with direct message" : ""} [#${ban.case_number}]`).join("\n");
			const unsuccessful_message = unsuccessful_bans.map(ban => `- <@${ban.id}> (${escape_all(ban.name)}): ${ban.error}`).join("\n");

			if (unsuccessful_bans.length === 0) {
				await context.respond(
					`:white_check_mark: Banned all ${args.user.length} users:\n${successful_message}`
				);
			} else if (successful_bans.length === 0) {
				await context.respond(
					`:x: None of ${args.user.length} users were banned:\n${unsuccessful_message}`
				);
			} else {
				await context.respond(
					`:warning: Only ${successful_bans.length} of ${args.user.length} bans were successful!\n`
					+ `Successful bans:\n${successful_message}\n`
					+ `Unsuccessful bans:\n${unsuccessful_message}`
				);
			}
		}
	},
});
