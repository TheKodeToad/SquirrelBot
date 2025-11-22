import {
	createDMCached,
	fetchMembersCached,
	fetchUserCached,
} from "#common/discord/cachedRequest.ts";
import { formatRESTError } from "#common/discord/format.ts";
import { getHighestRole } from "#common/discord/permissions.ts";
import { moduleLogger } from "#common/logger/index.ts";
import type { SquirrelDiscordContext } from "#discord/index.ts";
import { resolveGroups } from "#plugin/core/public/permissionResolution.ts";
import { MemberRanking } from "#plugin/moderation/config.ts";
import { onModAction } from "#plugin/moderation/public/extensionPoints.ts";
import {
	ModEventType,
	type ModEvent,
} from "#plugin/moderation/public/modEvent.ts";
import { createCase } from "#plugin/moderation/storage/cases.ts";
import {
	deleteTempBan,
	upsertTempBan,
	type TempBan,
} from "#plugin/moderation/storage/tempBans.ts";
import {
	trackNewTempBan,
	untrackTempBan,
} from "#plugin/moderation/tempBanScheduler.ts";
import {
	DiscordRESTError,
	Guild,
	Member,
	Permissions,
	User,
	type CreateMessageOptions,
	type Uncached,
} from "oceanic.js";

const logger = moduleLogger();

export type ModActionResult = ModEvent | ModActionFailure;

export interface ModAction
	extends Omit<ModEvent, "performedAt" | "dmDelivered" | "caseNumber"> {
	ranking: MemberRanking;
	directMessage?: CreateMessageOptions;
}

export interface ModActionFailure {
	target: User | Member | Uncached;
	error: string;
}

export async function performModAction(
	ctx: SquirrelDiscordContext,
	action: ModAction,
): Promise<ModActionResult> {
	let dmDelivered = false;

	if (action.target instanceof Member) {
		if (!canModerate(action.ranking, action.actor, action.target)) {
			return {
				target: action.target,
				error: "You lack permission to moderate the user",
			};
		}

		if (
			botNeedsPerm(action.type) &&
			!canModerate(
				MemberRanking.HighestRole,
				action.guild.clientMember,
				action.target,
			)
		) {
			return {
				target: action.target,
				error: "App lacks permission to moderate the user",
			};
		}

		switch (action.type) {
			case ModEventType.Timeout:
				if (action.target.permissions.has(Permissions.ADMINISTRATOR)) {
					return {
						target: action.target,
						error: "Member has admin permissions",
					};
				}

				break;
			case ModEventType.ClearTimeout:
				if (
					action.target.communicationDisabledUntil === null ||
					action.target.communicationDisabledUntil.getTime() < Date.now()
				) {
					return { target: action.target, error: "Member is not timed out" };
				}

				break;
		}

		if (action.directMessage !== undefined && !action.target.bot) {
			const dmChannel = await createDMCached(ctx.bot, action.target.id);
			try {
				await dmChannel.createMessage(action.directMessage);
				dmDelivered = true;
			} catch (error) {
				if (!(error instanceof DiscordRESTError)) {
					throw error;
				}
			}
		}
	} else {
		switch (action.type) {
			case ModEventType.Timeout:
			case ModEventType.ClearTimeout:
			case ModEventType.Kick:
				return {
					target: action.target,
					error: "User is not a member of the server",
				};
		}
	}

	const performedAt = new Date();

	try {
		switch (action.type) {
			case ModEventType.Note:
			case ModEventType.Warn:
				break;
			case ModEventType.Timeout:
				await action.guild.editMember(action.target.id, {
					communicationDisabledUntil: action.expiresAt?.toISOString() ?? null,
					reason: action.reason,
				});
				break;
			case ModEventType.ClearTimeout:
				await action.guild.editMember(action.target.id, {
					communicationDisabledUntil: null,
					reason: action.reason,
				});
				break;
			case ModEventType.Kick:
				await action.guild.removeMember(action.target.id);
				break;
			case ModEventType.Ban:
				await action.guild.createBan(action.target.id, {
					deleteMessageSeconds: action.deleteMessageSeconds,
					reason: action.reason,
				});

				break;
			case ModEventType.Unban:
				await action.guild.removeBan(action.target.id, action.reason);
				break;
		}
	} catch (error) {
		if (!(error instanceof DiscordRESTError)) {
			throw error;
		}

		return { target: action.target, error: formatRESTError(error) };
	}

	const result: ModEvent = { ...action, performedAt, dmDelivered };
	result.caseNumber = await createCase(ctx.db, action.guild.id, result);

	if (action.type === ModEventType.Ban) {
		untrackTempBan(action.guild.id, action.target.id);

		// FIXME: race condition
		if (action.expiresAt !== undefined) {
			const tempBan: TempBan = {
				guildID: action.guild.id,
				targetID: action.target.id,

				endsAt: action.expiresAt,
				caseNumber: result.caseNumber,
			};

			await upsertTempBan(ctx.db, action.guild.id, tempBan);
			trackNewTempBan(tempBan);
		} else {
			await deleteTempBan(ctx.db, action.guild.id, action.target.id);
		}
	}

	onModAction
		.fire(ctx, result)
		.catch((error) => logger.error?.("Error in onModAction", error));

	return result;
}

function botNeedsPerm(type: ModEventType): boolean {
	switch (type) {
		case ModEventType.Note:
		case ModEventType.Warn:
			return false;
		default:
			return true;
	}
}

function canModerate(
	ranking: MemberRanking,
	actor: Member,
	target: Member,
): boolean {
	const guild = actor.guild;

	switch (ranking) {
		case MemberRanking.None:
			return true;
		case MemberRanking.HighestRole:
			if (guild.id !== target.guild.id) {
				throw new Error("Comparing across guilds");
			}

			return (
				target.id !== guild.ownerID &&
				(actor.id === guild.ownerID ||
					getHighestRole(actor).position > getHighestRole(target).position)
			);
		case MemberRanking.Level: {
			const { level: actorLevel } = resolveGroups(actor);
			const { level: targetLevel } = resolveGroups(target);

			return actorLevel > targetLevel;
		}
	}
}

export interface BulkModActionResult {
	successful: ModEvent[];
	unsuccessful: ModActionFailure[];
}

export async function performModActions(
	ctx: SquirrelDiscordContext,
	guild: Guild,
	ids: readonly string[],
	makeAction: (target: Member | User) => ModAction,
): Promise<BulkModActionResult> {
	const result: BulkModActionResult = { successful: [], unsuccessful: [] };

	const members = await fetchMembersCached(guild, ids);

	for (const id of ids) {
		let target: Member | User;

		const member = members.get(id);

		if (member !== undefined) {
			target = member;
		} else {
			try {
				target = await fetchUserCached(ctx.bot, id);
			} catch (error) {
				if (!(error instanceof DiscordRESTError)) {
					throw error;
				}

				result.unsuccessful.push({
					target: { id },
					error: "User fetch failed: " + formatRESTError(error),
				});
				continue;
			}
		}

		const action = makeAction(target);

		// TODO: parallelism
		const event = await performModAction(ctx, action);

		if ("error" in event) {
			result.unsuccessful.push(event);
		} else {
			result.successful.push(event);
		}
	}

	return result;
}
