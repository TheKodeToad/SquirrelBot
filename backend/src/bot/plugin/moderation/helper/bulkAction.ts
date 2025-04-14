import { DiscordRESTError, type CreateMessageOptions, type Guild, type Member, type User } from "oceanic.js";
import { createCase, type CreateCaseOptions } from "../../../../db/moderation/cases.ts";
import { createDMCached, getUserCached, requestMembersCached } from "../../../common/discord/cache.ts";
import { formatRESTError } from "../../../common/discord/format.ts";
import { getHighestRole } from "../../../common/discord/permissions.ts";
import { bot } from "../../../index.ts";

type BulkAction =
	(
		{
			membersOnly: true;
			perform: (user: Member) => Promise<void>;
		}
		| {
			membersOnly: false;
			perform: (user: Member | User) => Promise<void>;
		}
	)
	& {
		guild: Guild;
		ids: readonly string[];

		actor: Member;
		directMessage?: CreateMessageOptions;

		makeCase(actor: string, target: string, dmDelivered: boolean): CreateCaseOptions | null;
	};

interface BulkResult {
	successful: {
		id: string;
		name: string;
		caseNumber: number | null;
		dmDelivered: boolean;
	}[];
	unsuccessful: {
		id: string;
		name: string | null;
		error: string;
	}[];
}

export async function doBulkAction(action: BulkAction): Promise<BulkResult> {
	let result: BulkResult = { successful: [], unsuccessful: [] };

	const members = await requestMembersCached(action.guild, action.ids);

	for (const targetID of action.ids) {
		const targetMember = members.get(targetID);

		if (targetMember === undefined) {
			try {
				var targetUser = await getUserCached(targetID);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				result.unsuccessful.push({
					id: targetID,
					name: "<unknown>",
					error: "User fetch failed: " + formatRESTError(error)
				});
				continue;
			}

			if (action.membersOnly) {
				result.unsuccessful.push({
					id: targetID,
					name: targetUser.username,
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
					id: targetID,
					name: targetUser.tag,
					error: formatRESTError(error),
				});
				continue;
			}

			let caseNumber: number | null = null;

			if (action.makeCase !== undefined) {
				const newCase = action.makeCase(action.actor.id, targetID, false);

				if (newCase !== null)
					caseNumber = await createCase(action.guild.id, newCase);
			}

			result.successful.push({
				id: targetID,
				name: targetUser.tag,
				caseNumber,
				dmDelivered: false,
			});

			continue;
		}

		const targetPosition = getHighestRole(targetMember).position;

		if (action.guild.ownerID !== action.actor.id
			&& (action.guild.ownerID === targetID
				|| getHighestRole(action.actor).position <= targetPosition)) {
			result.unsuccessful.push({ id: targetID, name: targetMember.tag, error: "Your highest role is not above target's highest role" });
			continue;
		}

		if (action.guild.ownerID !== bot.user.id
			&& (action.guild.ownerID === targetID
				|| getHighestRole(action.guild.clientMember).position <= targetPosition)
		) {
			result.unsuccessful.push({ id: targetID, name: targetMember.tag, error: "Bot's highest role is not above target's highest role" });
			continue;
		}

		let dmDelivered = false;

		if (action.directMessage !== undefined && !targetMember.bot) {
			const dmChannel = await createDMCached(targetMember.id);
			try {
				dmChannel.createMessage(action.directMessage);
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
				id: targetID,
				name: targetMember.tag,
				error: formatRESTError(error),
			});
			continue;
		}

		let caseNumber: number | null = null;

		if (action.makeCase !== undefined) {
			const newCase = action.makeCase(action.actor.id, targetID, dmDelivered);

			if (newCase !== null)
				caseNumber = await createCase(action.guild.id, newCase);
		}

		result.successful.push({
			id: targetID,
			name: targetMember.tag,
			caseNumber,
			dmDelivered,
		});
	}

	return result;
}