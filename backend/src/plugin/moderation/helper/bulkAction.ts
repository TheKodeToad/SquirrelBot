import { createDMCached, fetchMembersCached, fetchUserCached } from "#common/discord/cachedRequest.ts";
import { formatRESTError } from "#common/discord/format.ts";
import { getHighestRole } from "#common/discord/permissions.ts";
import { createCase, type CreateCaseOptions } from "#db/moderation/cases.ts";
import { DiscordRESTError, Member, type CreateMessageOptions, type Guild, type Uncached, type User } from "oceanic.js";

type BulkAction =
	(
		{
			membersOnly: true;
			perform: (member: Member, calculatedExpiry: Date | undefined) => Promise<void> | void;
		}
		| {
			membersOnly: false;
			perform: (user: Member | User, caculatedExpiry: Date | undefined) => Promise<void> | void;
		}
	)
	& {
		guild: Guild;
		ids: readonly string[];

		actor: Member;
		directMessage?: CreateMessageOptions;
		duration?: number;

		check?(member: Member): Promise<string | true> | string | true;
		makeCase(options: Pick<CreateCaseOptions, "createdAt" | "expiresAt" | "actorID" | "targetID" | "dmDelivered">): CreateCaseOptions;
	};

export interface BulkSuccessEntry {
	user: User | Member;
	caseNumber: number;
	dmDelivered: boolean;
}

export interface BulkErrorEntry {
	user: User | Member | Uncached;
	error: string;
}

export interface BulkResult {
	successful: BulkSuccessEntry[];
	unsuccessful: BulkErrorEntry[];
}

export async function doBulkAction(action: BulkAction): Promise<BulkResult> {
	const result: BulkResult = { successful: [], unsuccessful: [] };

	const members = await fetchMembersCached(action.guild, action.ids);

	// eslint-disable-next-line @typescript-eslint/unbound-method
	action.check ??= () => true;

	for (const targetID of action.ids) {
		let target: Member | User;
		let dmDelivered = false;

		const targetMember = members.get(targetID);

		if (targetMember !== undefined) {
			target = targetMember;

			if (!canModerate(action.actor, target)) {
				result.unsuccessful.push({
					error: "You lack permission to moderate the user",
					user: target,
				});
				continue;
			}

			const checkResult = await action.check(target);

			if (checkResult !== true) {
				result.unsuccessful.push({
					error: checkResult,
					user: target,
				});
				continue;
			}

			if (!canModerate(action.guild.clientMember, target)) {
				result.unsuccessful.push({
					error: "App lacks permission to moderate the user",
					user: target,
				});
				continue;
			}

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
		} else {
			try {
				target = await fetchUserCached(targetID);
			} catch (error) {
				if (!(error instanceof DiscordRESTError))
					throw error;

				result.unsuccessful.push({
					user: { id: targetID },
					error: "User fetch failed: " + formatRESTError(error)
				});
				continue;
			}
		}

		const createdAt = new Date;
		const expiresAt = action.duration !== undefined ? new Date(createdAt.getTime() + action.duration) : undefined;

		try {
			if (action.membersOnly) {
				if (!(target instanceof Member)) {
					result.unsuccessful.push({
						error: "The user is not a member of the server",
						user: target,
					});
					continue;
				}

				await action.perform(target, expiresAt);
			} else
				await action.perform(target, expiresAt);
		} catch (error) {
			if (!(error instanceof DiscordRESTError))
				throw error;

			result.unsuccessful.push({
				user: target,
				error: formatRESTError(error),
			});
			continue;
		}

		const caseOptions = action.makeCase({
			createdAt,
			expiresAt,
			actorID: action.actor.id,
			targetID: targetID,
			dmDelivered,
		});

		const caseNumber = await createCase(action.guild.id, caseOptions);

		result.successful.push({
			user: target,
			caseNumber,
			dmDelivered,
		});
	}

	return result;
}

function canModerate(actor: Member, target: Member): boolean {
	const guild = actor.guild;

	if (guild.id !== target.guild.id)
		throw new Error("Comparing across guilds");

	return target.id !== guild.ownerID && (actor.id === guild.ownerID || getHighestRole(actor).position > getHighestRole(target).position);
}
