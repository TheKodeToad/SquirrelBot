import { DiscordRESTError, Permissions } from "oceanic.js";
import { bot } from "../../..";
import { format_rest_error, get_highest_role, get_user_cached, request_members_cached } from "../../../common/discord";
import { escape_all } from "../../../common/markdown";
import { OptionType, define_command } from "../../../core/types/command";
import { CaseType, create_case } from "../common/case";

export const kick_command = define_command({
	id: "kick",
	options: {
		user: {
			type: OptionType.USER,
			id: "user",
			array: true,
			required: true,
			position: 0,
		},
		reason: {
			type: OptionType.STRING,
			id: "reason",
			position: 1,
		},
		dm: {
			type: OptionType.VOID,
			id: "dm",
		},
		no_dm: {
			type: OptionType.VOID,
			id: ["no-dm", "!dm"],
		},
	},
	async run(context, args) {
		if (context.guild === null)
			return;

		if (!context.member?.permissions?.has(Permissions.KICK_MEMBERS))
			return;

		const members = await request_members_cached(context.guild, args.user);

		let successful_kicks: { case_number: number, id: string, name: string, dm_sent: boolean; }[] = [];
		let unsuccessful_kicks: { id: string, name: string, error: string; }[] = [];

		for (const target of args.user) {
			const target_member = members.get(target);

			if (target_member === undefined) {
				try {
					const user = await get_user_cached(target);
					unsuccessful_kicks.push({ id: target, name: user.tag, error: "User is not in the server" });
				} catch (error) {
					if (!(error instanceof DiscordRESTError))
						throw error;

					unsuccessful_kicks.push({ id: target, name: "<unknown>", error: "User is not in the server" });
				}

				continue;
			}

			const name = target_member.tag;
			const target_position = get_highest_role(target_member).position;

			if (context.guild.ownerID !== context.user.id
				&& (context.guild.ownerID === target
					|| get_highest_role(context.member).position <= target_position)) {
				unsuccessful_kicks.push({ id: target, name, error: "Your highest role is not above target's highest role" });
				continue;
			}

			if (context.guild.ownerID !== bot.user.id
				&& (context.guild.ownerID === target
					|| get_highest_role(context.guild.clientMember).position <= target_position)
			) {
				unsuccessful_kicks.push({ id: target, name, error: "Bot's highest role is not above target's highest role" });
				continue;
			}

			let dm_sent = false;

			if (!target_member.bot && !args.no_dm) {
				try {
					const dm = await bot.rest.users.createDM(target);
					await dm.createMessage({ content: "You were kicked :regional_indicator_l:" });
					dm_sent = true;
				} catch (error) {
					if (!(error instanceof DiscordRESTError))
						throw error;
				}
			}

			try {
				await context.guild.removeMember(target, args.reason ?? undefined);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				unsuccessful_kicks.push({ id: target, name, error: format_rest_error(error) });
				continue;
			}

			const case_number = await create_case(context.guild.id, {
				type: CaseType.KICK,
				actor_id: context.user.id,
				target_id: target,
				reason: args.reason ?? undefined
			});

			successful_kicks.push({ case_number, id: target, name, dm_sent });
		}

		if (args.user.length === 1) {
			if (successful_kicks.length === 1) {
				const kick = successful_kicks[0]!;
				await context.respond(`:white_check_mark: Kicked <@${kick.id}> (${escape_all(kick.name)})${kick.dm_sent ? " with direct message" : ""} [#${kick.case_number}]!`);
			} else if (unsuccessful_kicks.length === 1) {
				const kick = unsuccessful_kicks[0]!;
				await context.respond(`:x: Could not kick <@${kick.id}> (${escape_all(kick.name)}): ${kick.error}!`);
			}
		} else {
			const successful_message = successful_kicks.map(kick => `- <@${kick.id}> (${escape_all(kick.name)}) ${kick.dm_sent ? " with direct message" : ""} [#${kick.case_number}]`).join("\n");
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
	},
});
