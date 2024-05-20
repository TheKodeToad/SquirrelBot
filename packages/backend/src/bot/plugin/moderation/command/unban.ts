import { DiscordRESTError, JSONErrorCodes, Permissions } from "oceanic.js";
import { CaseType, create_case } from "../../../../data/moderation/case";
import { format_rest_error, get_tag_or_unknown } from "../../../common/discord";
import { escape_all } from "../../../common/markdown";
import { OptionType, define_command } from "../../../core/types/command";

export const unban_command = define_command({
	id: "unban",
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
	},
	async run(context, args) {
		if (context.guild === null)
			return;

		if (!context.member?.permissions.has(Permissions.BAN_MEMBERS))
			return;

		let successful_unbans: { case_number: number, id: string, name: string; }[] = [];
		let unsuccessful_unbans: { id: string, name: string, error: string; }[] = [];

		for (const target of args.user) {
			const cached_member = context.guild.members.get(target);
			if (cached_member !== undefined) {
				unsuccessful_unbans.push({
					id: target,
					name: cached_member.tag,
					error: "User is not banned",
				});
				continue;
			}

			try {
				var ban = await context.guild.getBan(target);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				if (error.code === JSONErrorCodes.UNKNOWN_BAN) {
					unsuccessful_unbans.push({
						id: target,
						name: await get_tag_or_unknown(target),
						error: "User is not banned",
					});
				} else {
					unsuccessful_unbans.push({
						id: target,
						name: error.code === JSONErrorCodes.UNKNOWN_USER ? "<unknown>" : await get_tag_or_unknown(target),
						error: `Ban fetch failed: ${format_rest_error(error)}`,
					});
				}

				continue;
			}

			try {
				await context.guild.removeBan(target, args.reason ?? undefined);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				unsuccessful_unbans.push({ id: target, name: ban.user.tag, error: format_rest_error(error) });
				continue;
			}

			const case_number = await create_case(context.guild.id, {
				type: CaseType.UNBAN,
				actor_id: context.user.id,
				target_id: target,
				reason: args.reason ?? undefined,
			});

			successful_unbans.push({ case_number, id: target, name: ban.user.tag });
		}

		if (args.user.length === 1) {
			if (successful_unbans.length === 1) {
				const unban = successful_unbans[0]!;
				await context.respond(`:white_check_mark: Unbanned <@${unban.id}> (${escape_all(unban.name)}) [#${unban.case_number}]!`);
			} else if (unsuccessful_unbans.length === 1) {
				const unban = unsuccessful_unbans[0]!;
				await context.respond(`:x: Could not unban <@${unban.id}> (${escape_all(unban.name)}): ${unban.error}!`);
			}
		} else {
			const successful_message = successful_unbans.map(unban => `- <@${unban.id}> (${escape_all(unban.name)}) [#${unban.case_number}]`).join("\n");
			const unsuccessful_message = unsuccessful_unbans.map(unban => `- <@${unban.id}> (${escape_all(unban.name)}): ${unban.error}`).join("\n");

			if (unsuccessful_unbans.length === 0) {
				await context.respond(
					`:white_check_mark: Unbanned all ${args.user.length} users:\n${successful_message}`
				);
			} else if (successful_unbans.length === 0) {
				await context.respond(
					`:x: None of ${args.user.length} users were unbanned:\n${unsuccessful_message}`
				);
			} else {
				await context.respond(
					`:warning: Only ${successful_unbans.length} of ${args.user.length} unbans were successful!\n`
					+ `Successful unbans:\n${successful_message}\n`
					+ `Unsuccessful unbans:\n${unsuccessful_message}`
				);
			}
		}
	},
});
