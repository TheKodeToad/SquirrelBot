import { CaseType } from "../../../../db/moderation/cases.ts";
import { escape_markdown } from "../../../common/discord/markdown.ts";
import { permissions_guard } from "../../core/public/command/helper.ts";
import { OptionType, define_command } from "../../core/public/command/index.ts";
import { icons } from "../../core/public/icons.ts";
import { do_batch_action } from "../helper/batch_action.ts";
import { moderation_config } from "../index.ts";

export const ban_command = define_command({
	name: ["ban"],
	options: {
		user: {
			type: OptionType.USER,
			name: ["user", "u"],
			array: true,
			required: true,
			position: 0,
		},
		reason: {
			type: OptionType.STRING,
			name: ["reason", "r"],
			position: 1,
		},
		dm: {
			type: OptionType.FLAG,
			name: ["dm", "d", "direct-message"],
			negative_name: ["no-dm", "nd", "no-direct-message"],
		},
		purge: {
			type: OptionType.NUMBER,
			name: ["purge", "p", "delete"],
		},
	},

	pre_run: context => permissions_guard(context, moderation_config, permissions => permissions.ban),
	async run(context, args, { config }) {
		const send_direct_message = args.dm ?? config.ban.send_direct_message;

		const direct_message = send_direct_message
			? config.ban.direct_message ?? {
				content: `You are permanently banned from ${escape_markdown(context.guild.name)}.`
			}
			: undefined;

		const delete_message_seconds = (args.purge ?? config.ban.purge_messages) * (1000 * 60 * 60 * 24);

		const { successful, unsuccessful } = await do_batch_action({
			guild: context.guild,
			ids: args.user,

			actor: context.member,
			direct_message,

			members_only: false,

			async perform(user) {
				await context.guild.createBan(user.id, {
					reason: args.reason ?? undefined,
					deleteMessageSeconds: delete_message_seconds,
				});
			},
			make_case(actor, target, dm_delivered) {
				return {
					type: CaseType.Ban,
					actor_id: actor,
					target_id: target,
					reason: args.reason ?? undefined,
					delete_message_seconds,
					dm_delivered,
				};
			},
		});

		if (args.user.length === 1) {
			if (successful.length === 1) {
				const ban = successful[0]!;
				await context.respond(`${icons.success} Banned <@${ban.id}> (${escape_markdown(ban.name)})${ban.dm_delivered ? " with direct message" : ""} [#${ban.case_number}]!`);
			} else if (unsuccessful.length === 1) {
				const ban = unsuccessful[0]!;
				await context.respond(`${icons.error} Could not ban <@${ban.id}> (${escape_markdown(ban.name ?? "<unknown>")}): ${escape_markdown(ban.error)}!`);
			}
		} else {
			const successful_message = successful.map(ban => `- <@${ban.id}> (${escape_markdown(ban.name)})${ban.dm_delivered ? " with direct message" : ""} [#${ban.case_number}]`).join("\n");
			const unsuccessful_message = unsuccessful.map(ban => `- <@${ban.id}> (${escape_markdown(ban.name ?? "<unknown>")}): ${escape_markdown(ban.error)}`).join("\n");

			if (unsuccessful.length === 0) {
				await context.respond(
					`${icons.success} Banned all ${args.user.length} users:\n${successful_message}`
				);
			} else if (successful.length === 0) {
				await context.respond(
					`${icons.error} None of ${args.user.length} users were banned:\n${unsuccessful_message}`
				);
			} else {
				await context.respond(
					`${icons.warning} Only ${successful.length} of ${args.user.length} bans were successful!\n`
					+ `Successful bans:\n${successful_message}\n`
					+ `Unsuccessful bans:\n${unsuccessful_message}`
				);
			}
		}
	},
});
