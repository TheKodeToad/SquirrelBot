import { DiscordRESTError, Permissions } from "oceanic.js";
import { bot } from "../../..";
import { CaseType, create_case } from "../../../../data/moderation/cases";
import { create_dm_cached, get_user_cached, request_members_cached } from "../../../common/discord/cache";
import { format_rest_error } from "../../../common/discord/format";
import { escape_markdown } from "../../../common/discord/markdown";
import { get_highest_role } from "../../../common/discord/permissions";
import { Icons } from "../../../core/icons";
import { OptionType, define_command } from "../../../core/types/command";

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

		const members = await request_members_cached(context.guild, args.user);

		let successful_bans: { case_number: number, id: string, name: string, dm_sent: boolean; }[] = [];
		let unsuccessful_bans: { id: string, name: string, error: string; }[] = [];

		for (const target of args.user) {
			let name: string;
			let in_guild: boolean;
			let is_bot: boolean;

			const target_member = members.get(target);

			if (target_member !== undefined) {
				name = target_member.tag;
				in_guild = true;
				is_bot = target_member.bot;

				const target_position = get_highest_role(target_member).position;

				if (context.guild.ownerID !== context.user.id
					&& (context.guild.ownerID === target
						|| get_highest_role(context.member).position <= target_position)) {
					unsuccessful_bans.push({ id: target, name, error: "Your highest role is not above target's highest role" });
					continue;
				}

				if (context.guild.ownerID !== bot.user.id
					&& (context.guild.ownerID === target
						|| get_highest_role(context.guild.clientMember).position <= target_position)
				) {
					unsuccessful_bans.push({ id: target, name, error: "Bot's highest role is not above target's highest role" });
					continue;
				}
			} else {
				try {
					const user = await get_user_cached(target);
					name = user.tag;
					in_guild = false;
					is_bot = user.bot;
				} catch (error) {
					if (!(error instanceof DiscordRESTError))
						throw error;

					unsuccessful_bans.push({ id: target, name: "<unknown>", error: `User fetch failed: ${format_rest_error(error)}` });
					continue;
				}
			}

			let dm_sent = false;

			if (in_guild && !is_bot && !args.no_dm) {
				try {
					const dm = await create_dm_cached(target);
					await dm.createMessage({ content: "You were banned :regional_indicator_l:" });
					dm_sent = true;
				} catch (error) {
					if (!(error instanceof DiscordRESTError))
						throw error;
				}
			}

			try {
				await context.guild.createBan(target, {
					reason: args.reason ?? undefined,
					deleteMessageSeconds: delete_message_seconds,
				});
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				unsuccessful_bans.push({ id: target, name, error: format_rest_error(error) });
				continue;
			}

			const case_number = await create_case(context.guild.id, {
				type: CaseType.Ban,
				actor_id: context.user.id,
				target_id: target,
				reason: args.reason ?? undefined,
				delete_message_seconds,
				dm_sent,
			});

			successful_bans.push({ case_number, id: target, name, dm_sent });
		}

		if (args.user.length === 1) {
			if (successful_bans.length === 1) {
				const ban = successful_bans[0]!;
				await context.respond(`${Icons.success} Banned <@${ban.id}> (${escape_markdown(ban.name)})${ban.dm_sent ? " with direct message" : ""} [#${ban.case_number}]!`);
			} else if (unsuccessful_bans.length === 1) {
				const ban = unsuccessful_bans[0]!;
				await context.respond(`${Icons.error} Could not ban <@${ban.id}> (${escape_markdown(ban.name)}): ${escape_markdown(ban.error)}!`);
			}
		} else {
			const successful_message = successful_bans.map(ban => `- <@${ban.id}> (${escape_markdown(ban.name)})${ban.dm_sent ? " with direct message" : ""} [#${ban.case_number}]`).join("\n");
			const unsuccessful_message = unsuccessful_bans.map(ban => `- <@${ban.id}> (${escape_markdown(ban.name)}): ${escape_markdown(ban.error)}`).join("\n");

			if (unsuccessful_bans.length === 0) {
				await context.respond(
					`${Icons.success} Banned all ${args.user.length} users:\n${successful_message}`
				);
			} else if (successful_bans.length === 0) {
				await context.respond(
					`${Icons.error} None of ${args.user.length} users were banned:\n${unsuccessful_message}`
				);
			} else {
				await context.respond(
					`${Icons.warning} Only ${successful_bans.length} of ${args.user.length} bans were successful!\n`
					+ `Successful bans:\n${successful_message}\n`
					+ `Unsuccessful bans:\n${unsuccessful_message}`
				);
			}
		}
	},
});
