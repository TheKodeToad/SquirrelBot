import { DiscordRESTError, type CreateMessageOptions, type Guild, type Member, type User } from "oceanic.js";
import { create_case, type CreateCaseOptions } from "../../../../db/moderation/cases.ts";
import { create_dm_cached, get_user_cached, request_members_cached } from "../../../common/discord/cache.ts";
import { format_rest_error } from "../../../common/discord/format.ts";
import { get_highest_role } from "../../../common/discord/permissions.ts";
import { bot } from "../../../index.ts";


type BatchAction =
	(
		{
			members_only: true;
			perform: (user: Member) => Promise<void>;
		}
		| {
			members_only: false;
			perform: (user: Member | User) => Promise<void>;
		}
	)
	& {
		guild: Guild;
		ids: readonly string[];

		actor: Member;
		direct_message?: CreateMessageOptions;

		make_case(actor: string, target: string, dm_delivered: boolean): CreateCaseOptions | null;
	};

interface BatchResult {
	successful: {
		id: string;
		name: string;
		case_number: number | null;
		dm_delivered: boolean;
	}[];
	unsuccessful: {
		id: string;
		name: string | null;
		error: string;
	}[];
}

export async function do_batch_action(action: BatchAction): Promise<BatchResult> {
	let result: BatchResult = { successful: [], unsuccessful: [] };

	const members = await request_members_cached(action.guild, action.ids);

	for (const target_id of action.ids) {
		const target_member = members.get(target_id);

		if (target_member === undefined) {
			try {
				var target_user = await get_user_cached(target_id);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				result.unsuccessful.push({
					id: target_id,
					name: "<unknown>",
					error: "User fetch failed: " + format_rest_error(error)
				});
				continue;
			}

			if (action.members_only) {
				result.unsuccessful.push({
					id: target_id,
					name: target_user.username,
					error: "User is not a member of the server",
				});
				continue;
			}

			try {
				await action.perform(target_user);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				result.unsuccessful.push({
					id: target_id,
					name: target_user.tag,
					error: format_rest_error(error),
				});
				continue;
			}

			let case_number: number | null = null;

			if (action.make_case !== undefined) {
				const new_case = action.make_case(action.actor.id, target_id, false);

				if (new_case !== null)
					case_number = await create_case(action.guild.id, new_case);
			}

			result.successful.push({
				id: target_id,
				name: target_user.tag,
				case_number,
				dm_delivered: false,
			});

			continue;
		}

		const target_position = get_highest_role(target_member).position;

		if (action.guild.ownerID !== action.actor.id
			&& (action.guild.ownerID === target_id
				|| get_highest_role(action.actor).position <= target_position)) {
			result.unsuccessful.push({ id: target_id, name: target_member.tag, error: "Your highest role is not above target's highest role" });
			continue;
		}

		if (action.guild.ownerID !== bot.user.id
			&& (action.guild.ownerID === target_id
				|| get_highest_role(action.guild.clientMember).position <= target_position)
		) {
			result.unsuccessful.push({ id: target_id, name: target_member.tag, error: "Bot's highest role is not above target's highest role" });
			continue;
		}

		let dm_delivered = false;

		if (action.direct_message !== undefined && !target_member.bot) {
			const dm_channel = await create_dm_cached(target_member.id);
			try {
				dm_channel.createMessage(action.direct_message);
				dm_delivered = true;
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;
			}
		}

		try {
			await action.perform(target_member);
		} catch (error) {
			if (!(error instanceof DiscordRESTError))
				throw error;

			result.unsuccessful.push({
				id: target_id,
				name: target_member.tag,
				error: format_rest_error(error),
			});
			continue;
		}

		let case_number: number | null = null;

		if (action.make_case !== undefined) {
			const new_case = action.make_case(action.actor.id, target_id, dm_delivered);

			if (new_case !== null)
				case_number = await create_case(action.guild.id, new_case);
		}

		result.successful.push({
			id: target_id,
			name: target_member.tag,
			case_number,
			dm_delivered,
		});
	}

	return result;
}