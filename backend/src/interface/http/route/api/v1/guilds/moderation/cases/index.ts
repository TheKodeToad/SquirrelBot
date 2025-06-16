import byFilter from "#interface/http/route/api/v1/guilds/moderation/cases/byFilter.ts";
import byNumber from "#interface/http/route/api/v1/guilds/moderation/cases/byNumber.ts";
import { CaseType, type CaseInfo } from "#plugin/moderation/storage/cases.ts";
import { Hono } from "hono";

export interface SerializedCaseObject {
	number: number;
	type: CaseType;
	createdAt: number;
	expiresAt: number | null;
	actorID: string;
	targetID: string;
	reason: string | null;
	deleteMessageSeconds: number | null;
	dmSent: boolean | null;
}

export function serializeCaseObject(info: CaseInfo): SerializedCaseObject {
	return {
		number: info.number,
		type: info.type,
		createdAt: info.createdAt.getTime(),
		expiresAt: info.expiresAt?.getTime() ?? null,
		actorID: info.actorID,
		targetID: info.targetID,
		reason: info.reason,
		deleteMessageSeconds: info.deleteMessageSeconds,
		dmSent: info.dmDelivered,
	};
}

const router = new Hono;
router.route("/", byNumber);
router.route("/", byFilter);
export default router;
