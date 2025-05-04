import { DiscordRESTError, type CreateMessageOptions, type Guild, type Member, type Uncached, type User } from "oceanic.js";
import { createCase, type CreateCaseOptions } from "../../../../db/moderation/cases.ts";
import { createDMCached, fetchMembersCached, fetchUserCached } from "../../../common/discord/cachedRequest.ts";
import { formatRESTError } from "../../../common/discord/format.ts";
import { getHighestRole } from "../../../common/discord/permissions.ts";
import { bot } from "../../../index.ts";

type BulkAction =
	(
		{
			membersOnly: true;
			perform: (user: Member) => Promise<void> | void;
		}
		| {
			membersOnly: false;
			perform: (user: Member | User) => Promise<void> | void;
		}
	)
	& {
		guild: Guild;
		ids: readonly string[];

		actor: Member;
		directMessage?: CreateMessageOptions;

		makeCase(actor: string, target: string, dmDelivered: boolean): CreateCaseOptions;
	};

export interface BulkResult {
	successful: {
		user: User | Member;
		caseNumber: number;
		dmDelivered: boolean;
	}[];
	unsuccessful: {
		user: User | Member | Uncached;
		error: string;
	}[];
}

export async function doBulkAction(action: BulkAction): Promise<BulkResult> {
	const result: BulkResult = { successful: [], unsuccessful: [] };

	const members = await fetchMembersCached(action.guild, action.ids);

	for (const targetID of action.ids) {
		const targetMember = members.get(targetID);

		if (targetMember === undefined) {
			try {
				var targetUser = await fetchUserCached(targetID);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				result.unsuccessful.push({
					user: { id: targetID },
					error: "User fetch failed: " + formatRESTError(error)
				});
				continue;
			}

			if (action.membersOnly) {
				result.unsuccessful.push({
					user: targetUser,
					error: "User is not a member of the server",
				});
				continue;
			}

			try {
				await action.perform(targetUser);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				result.unsuccessful.push({
					user: targetUser,
					error: formatRESTError(error),
				});
				continue;
			}

			const caseOptions = action.makeCase(action.actor.id, targetID, false);
			const caseNumber = await createCase(action.guild.id, caseOptions);

			result.successful.push({
				user: targetUser,
				caseNumber,
				dmDelivered: false,
			});

			continue;
		}

		const targetPosition = getHighestRole(targetMember).position;

		if (action.guild.ownerID !== action.actor.id
			&& (action.guild.ownerID === targetID
				|| getHighestRole(action.actor).position <= targetPosition)) {
			result.unsuccessful.push({
				user: targetMember,
				error: "Your highest role is not above target's highest role"
			});
			continue;
		}

		if (action.guild.ownerID !== bot.user.id
			&& (action.guild.ownerID === targetID
				|| getHighestRole(action.guild.clientMember).position <= targetPosition)
		) {
			result.unsuccessful.push({
				user: targetMember,
				error: "App's highest role is not above target's highest role"
			});
			continue;
		}

		let dmDelivered = false;

		if (action.directMessage !== undefined && !targetMember.bot) {
			const dmChannel = await createDMCached(targetMember.id);
			try {
				await dmChannel.createMessage(action.directMessage);
				dmDelivered = true;
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;
			}
		}

		try {
			await action.perform(targetMember);
		} catch (error) {
			if (!(error instanceof DiscordRESTError))
				throw error;

			result.unsuccessful.push({
				user: targetMember,
				error: formatRESTError(error),
			});
			continue;
		}

		const caseOptions = action.makeCase(action.actor.id, targetID, false);
		const caseNumber = await createCase(action.guild.id, caseOptions);

		result.successful.push({
			user: targetMember,
			caseNumber,
			dmDelivered,
		});
	}

	return result;
}
