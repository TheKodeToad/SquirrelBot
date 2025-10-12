import { createDMCached, fetchMembersCached, fetchUserCached } from "#common/discord/cachedRequest.ts";
import { formatRESTError } from "#common/discord/format.ts";
import { getHighestRole } from "#common/discord/permissions.ts";
import { resolveGroups } from "#plugin/core/public/permissionResolution.ts";
import { MemberRanking } from "#plugin/moderation/config.ts";
import { onModAction } from "#plugin/moderation/public/extensionPoints.ts";
import { ModActionType, type ModAction, type ModActionSuccess } from "#plugin/moderation/public/modAction.ts";
import { createCase } from "#plugin/moderation/storage/cases.ts";
import { DiscordRESTError, Guild, Member, Permissions, User, type Uncached } from "oceanic.js";

export type ModActionResult = ModActionSuccess | ModActionFailure;

export interface ModActionFailure {
	user: User | Member | Uncached;
	error: string;
}

export async function performModAction(action: ModAction): Promise<ModActionResult> {
	let dmDelivered = false;

	if (action.target instanceof Member) {
		if (!canModerate(action.ranking, action.actor, action.target))
			return { user: action.target, error: "You lack permission to moderate the user" };

		if (botNeedsPerm(action.type) && !canModerate(MemberRanking.HighestRole, action.guild.clientMember, action.target))
			return { user: action.target, error: "App lacks permission to moderate the user" };

		if (action.directMessage !== undefined && !action.target.bot) {
			const dmChannel = await createDMCached(action.target.id);
			try {
				await dmChannel.createMessage(action.directMessage);
				dmDelivered = true;
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;
			}
		}
	}

	const ERR_NOT_A_MEMBER = "User is not a member of the server";

	try {
		switch (action.type) {
		case ModActionType.Note:
		case ModActionType.VoiceMute:
		case ModActionType.VoiceUnmute:
		case ModActionType.Unwarn:
			throw new Error("TODO");
		case ModActionType.Warn:
			break;
		case ModActionType.Timeout:
			if (!(action.target instanceof Member))
				return { user: action.target, error: ERR_NOT_A_MEMBER };

			if (!action.target.permissions.has(Permissions.ADMINISTRATOR))
				return { user: action.target, error: "Member has admin permissions" };

			await action.target.edit({
				communicationDisabledUntil: action.expiresAt?.toISOString() ?? null,
				reason: action.reason,
			});
			break;
		case ModActionType.ClearTimeout:
			if (!(action.target instanceof Member))
				return { user: action.target, error: ERR_NOT_A_MEMBER };

			await action.target.edit({
				communicationDisabledUntil: null,
				reason: action.reason,
			});
			break;
		case ModActionType.Kick:
			if (!(action.target instanceof Member))
				return { user: action.target, error: ERR_NOT_A_MEMBER };

			await action.target.kick();
			break;
		case ModActionType.Ban:
			await action.guild.createBan(action.target.id, {
				deleteMessageSeconds: action.deleteMessageSeconds,
				reason: action.reason,
			});
			break;
		case ModActionType.Unban:
			await action.guild.removeBan(action.target.id, action.reason);
			break;
		}
	} catch (error) {
		if (!(error instanceof DiscordRESTError))
			throw error;

		return { user: action.target, error: formatRESTError(error) };
	}

	const caseNumber = await createCase(action.guild.id, action, dmDelivered);
	const result = { action, caseNumber, dmDelivered };

	await onModAction.fire(result);

	return result;
}

function botNeedsPerm(actionType: ModActionType) {
	switch (actionType) {
	case ModActionType.Note:
	case ModActionType.Warn:
		return false;
	default:
		return true;
	}
}

function canModerate(ranking: MemberRanking, actor: Member, target: Member): boolean {
	const guild = actor.guild;

	switch (ranking) {
	case MemberRanking.None:
		return true;
	case MemberRanking.HighestRole:
		if (guild.id !== target.guild.id)
			throw new Error("Comparing across guilds");

		return target.id !== guild.ownerID
			&& (actor.id === guild.ownerID || getHighestRole(actor).position > getHighestRole(target).position);
	case MemberRanking.Level: {
		const { level: actorLevel } = resolveGroups(actor);
		const { level: targetLevel } = resolveGroups(target);

		return actorLevel > targetLevel;
	}
	}
}

export interface BulkModActionResult {
	successful: ModActionSuccess[];
	unsuccessful: ModActionFailure[];
}

export async function performModActions(
	guild: Guild,
	ids: readonly string[],
	makeAction: (target: Member | User) => ModAction
): Promise<BulkModActionResult> {
	const result: BulkModActionResult = { successful: [], unsuccessful: [] };

	const members = await fetchMembersCached(guild, ids);

	for (const id of ids) {
		let target: Member | User;

		const member = members.get(id);

		if (member !== undefined)
			target = member;
		else {
			try {
				target = await fetchUserCached(id);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				result.unsuccessful.push({
					user: { id },
					error: "User fetch failed: " + formatRESTError(error)
				});
				continue;
			}
		}

		const action = makeAction(target);

		// TODO: parallelism
		const actionResult = await performModAction(action);

		if ("error" in actionResult)
			result.unsuccessful.push(actionResult);
		else
			result.successful.push(actionResult);
	}

	return result;
}
